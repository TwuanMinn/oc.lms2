import "server-only";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { classeSessions, attendanceRecords, weekMaterials, sessionTeachers } from "@/server/db/schema/attendance";
import { users } from "@/server/db/schema/users";
import { courses, courseTeachers } from "@/server/db/schema/courses";
import { enrollments } from "@/server/db/schema/learning";
import { TRPCError } from "@trpc/server";
import { typedRows } from "@/lib/utils";

// ── ADMIN: Create a class session ──

export async function createClassSession(input: {
  classCode: string;
  courseName: string;
  teacherId: string;
  coTeacherIds?: string[];
  title: string;
  scheduledAt: string;
  group?: string;
}) {
  // Look up by courseCode first (unique identifier), then by title as fallback
  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.courseCode, input.classCode));

  if (!course) {
    // Fallback: check by title + group combo to avoid accidental duplicates
    const titleMatches = await db
      .select()
      .from(courses)
      .where(eq(courses.title, input.courseName));
    const groupMatch = titleMatches.find(c => (c.group || null) === (input.group || null));
    if (groupMatch) course = groupMatch;
  }

  if (!course) {
    const slug =
      input.courseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 7);

    [course] = await db
      .insert(courses)
      .values({
        title: input.courseName,
        slug,
        courseCode: input.classCode,
        teacherId: input.teacherId,
        group: input.group || null,
        status: "PUBLISHED",
        approved: true,
      })
      .returning();
  } else {
    // Backfill courseCode/group on existing course if missing
    const updates: Record<string, unknown> = {};
    if (!course.courseCode) updates.courseCode = input.classCode;
    if (!course.group && input.group) updates.group = input.group;
    if (Object.keys(updates).length > 0) {
      [course] = await db.update(courses).set(updates).where(eq(courses.id, course.id)).returning();
    }
  }

  // Check for duplicate class code before insert
  const [existingSession] = await db
    .select({ id: classeSessions.id })
    .from(classeSessions)
    .where(eq(classeSessions.classCode, input.classCode));

  if (existingSession) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Class code "${input.classCode}" already exists. Use a different code or delete the existing class first.`,
    });
  }

  const [session] = await db
    .insert(classeSessions)
    .values({
      classCode: input.classCode,
      courseId: course.id,
      teacherId: input.teacherId,
      title: input.title,
      scheduledAt: new Date(input.scheduledAt),
    })
    .returning();

  // Seed join tables with the primary teacher + any co-teachers so multi-select UIs
  // have consistent state
  const allTeacherIds = new Set<string>([input.teacherId, ...(input.coTeacherIds ?? [])]);
  const teacherRows = Array.from(allTeacherIds);

  await db
    .insert(courseTeachers)
    .values(teacherRows.map((userId) => ({ courseId: course.id, userId })))
    .onConflictDoNothing({ target: [courseTeachers.courseId, courseTeachers.userId] });

  await db
    .insert(sessionTeachers)
    .values(teacherRows.map((userId) => ({ sessionId: session.id, userId })))
    .onConflictDoNothing({ target: [sessionTeachers.sessionId, sessionTeachers.userId] });

  return session;
}

// ── ADMIN: List all class sessions ──

export async function getClassSessions(input: {
  limit: number;
  offset: number;
}) {
  interface SessionRow {
    id: string;
    classCode: string;
    courseId: string;
    title: string;
    courseTitle: string;
    courseGroup: string | null;
    teacherName: string;
    scheduledAt: Date;
    createdAt: Date;
    studentCount: number;
    scheduleRoom: string | null;
    scheduleClassType: string | null;
    scheduleDays: string | null;
    schedulePeriods: string | null;
  }

  const [sessions, totalResult] = await Promise.all([
    db.execute(sql`
      SELECT
        cs.id,
        cs.class_code AS "classCode",
        cs.course_id AS "courseId",
        cs.title,
        c.title AS "courseTitle",
        c."group" AS "courseGroup",
        u.name AS "teacherName",
        cs.scheduled_at AS "scheduledAt",
        cs.created_at AS "createdAt",
        COALESCE(ec.cnt, 0)::int AS "studentCount",
        se.room AS "scheduleRoom",
        se.class_type AS "scheduleClassType",
        se.schedule_days AS "scheduleDays",
        se.schedule_periods AS "schedulePeriods"
      FROM class_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN users u ON u.id = cs.teacher_id
      LEFT JOIN (
        SELECT course_id, count(*) AS cnt FROM enrollments GROUP BY course_id
      ) ec ON ec.course_id = cs.course_id
      LEFT JOIN (
        SELECT
          course_id,
          string_agg(DISTINCT TRIM(TO_CHAR(start_time AT TIME ZONE 'Asia/Ho_Chi_Minh', 'Day')), ', ') AS schedule_days,
          string_agg(DISTINCT TO_CHAR(start_time AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI') || ' – ' || TO_CHAR(end_time AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI'), ', ') AS schedule_periods,
          (array_agg(room ORDER BY created_at DESC NULLS LAST))[1] AS room,
          (array_agg(class_type ORDER BY created_at DESC NULLS LAST))[1] AS class_type
        FROM schedule_events
        GROUP BY course_id
      ) se ON se.course_id = cs.course_id
      ORDER BY cs.scheduled_at DESC
      LIMIT ${input.limit} OFFSET ${input.offset}
    `),
    db.select({ count: count() }).from(classeSessions),
  ]);

  return {
    sessions: typedRows<SessionRow>(sessions),
    total: totalResult[0]?.count ?? 0,
  };
}

// ── ADMIN: Delete class session ──

export async function deleteClassSession(sessionId: string) {
  await db.delete(classeSessions).where(eq(classeSessions.id, sessionId));
  return { success: true };
}

// ── ADMIN: Update a single class session (title / scheduled time / teacher set) ──

export async function updateClassSession(input: {
  sessionId: string;
  title?: string;
  scheduledAt?: string;
  primaryTeacherId?: string;
  teacherIds?: string[];
}) {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.scheduledAt !== undefined) updates.scheduledAt = new Date(input.scheduledAt);
  if (input.primaryTeacherId !== undefined) updates.teacherId = input.primaryTeacherId;

  let session;
  if (Object.keys(updates).length) {
    [session] = await db
      .update(classeSessions)
      .set(updates)
      .where(eq(classeSessions.id, input.sessionId))
      .returning();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }
  } else {
    [session] = await db.select().from(classeSessions).where(eq(classeSessions.id, input.sessionId));
    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }
  }

  // Replace teacher set for this session if provided. Primary teacher is always included.
  if (input.teacherIds !== undefined) {
    const finalSet = new Set<string>(input.teacherIds);
    finalSet.add(session.teacherId);
    await db.delete(sessionTeachers).where(eq(sessionTeachers.sessionId, session.id));
    if (finalSet.size) {
      await db
        .insert(sessionTeachers)
        .values(Array.from(finalSet).map((userId) => ({ sessionId: session.id, userId })))
        .onConflictDoNothing({ target: [sessionTeachers.sessionId, sessionTeachers.userId] });
    }
  } else if (input.primaryTeacherId !== undefined) {
    // Primary changed but no explicit set: make sure primary is in the set
    await db
      .insert(sessionTeachers)
      .values({ sessionId: session.id, userId: input.primaryTeacherId })
      .onConflictDoNothing({ target: [sessionTeachers.sessionId, sessionTeachers.userId] });
  }

  return session;
}

// ── ADMIN: Update course meta + cascade primary teacher to all its sessions ──

export async function updateCourseMeta(input: {
  courseId: string;
  title?: string;
  teacherId?: string;
  teacherIds?: string[];
  group?: string | null;
}) {
  const courseUpdates: Record<string, unknown> = {};
  if (input.title !== undefined) courseUpdates.title = input.title;
  if (input.teacherId !== undefined) courseUpdates.teacherId = input.teacherId;
  if (input.group !== undefined) courseUpdates.group = input.group;

  let course;
  if (Object.keys(courseUpdates).length) {
    [course] = await db
      .update(courses)
      .set(courseUpdates)
      .where(eq(courses.id, input.courseId))
      .returning();

    if (!course) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
    }
  } else {
    [course] = await db.select().from(courses).where(eq(courses.id, input.courseId));
    if (!course) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
    }
  }

  // If primary teacher changed, cascade to all sessions of this course
  if (input.teacherId !== undefined) {
    await db
      .update(classeSessions)
      .set({ teacherId: input.teacherId })
      .where(eq(classeSessions.courseId, input.courseId));
  }

  // Replace course-level teacher set if provided. Primary teacher is always included.
  if (input.teacherIds !== undefined) {
    const finalSet = new Set<string>(input.teacherIds);
    finalSet.add(course.teacherId);
    await db.delete(courseTeachers).where(eq(courseTeachers.courseId, course.id));
    if (finalSet.size) {
      await db
        .insert(courseTeachers)
        .values(Array.from(finalSet).map((userId) => ({ courseId: course.id, userId })))
        .onConflictDoNothing({ target: [courseTeachers.courseId, courseTeachers.userId] });
    }

    // Prune per-session teachers that are no longer on the course (keep primary)
    const courseSessions = await db
      .select({ id: classeSessions.id, teacherId: classeSessions.teacherId })
      .from(classeSessions)
      .where(eq(classeSessions.courseId, course.id));

    if (courseSessions.length) {
      const sessionIds = courseSessions.map((s) => s.id);
      const keepIds = Array.from(finalSet);
      await db
        .delete(sessionTeachers)
        .where(
          and(
            inArray(sessionTeachers.sessionId, sessionIds),
            sql`${sessionTeachers.userId} NOT IN (${sql.join(keepIds.map((id) => sql`${id}::uuid`), sql`, `)})`
          )
        );

      // Ensure every session still has its primary teacher in the set
      await db
        .insert(sessionTeachers)
        .values(courseSessions.map((s) => ({ sessionId: s.id, userId: s.teacherId })))
        .onConflictDoNothing({ target: [sessionTeachers.sessionId, sessionTeachers.userId] });
    }
  } else if (input.teacherId !== undefined) {
    // Primary changed but no explicit set: make sure primary is in the course_teachers set
    await db
      .insert(courseTeachers)
      .values({ courseId: course.id, userId: input.teacherId })
      .onConflictDoNothing({ target: [courseTeachers.courseId, courseTeachers.userId] });
  }

  return course;
}

// ── ADMIN: Fetch teacher assignments for a course + all its sessions ──

export async function getCourseTeacherAssignments(courseId: string) {
  const [course] = await db
    .select({ id: courses.id, primaryTeacherId: courses.teacherId })
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  const courseTeacherRows = await db
    .select({ userId: courseTeachers.userId })
    .from(courseTeachers)
    .where(eq(courseTeachers.courseId, courseId));

  const sessions = await db
    .select({ id: classeSessions.id, primaryTeacherId: classeSessions.teacherId })
    .from(classeSessions)
    .where(eq(classeSessions.courseId, courseId));

  const sessionIds = sessions.map((s) => s.id);
  const sessionTeacherRows = sessionIds.length
    ? await db
        .select({ sessionId: sessionTeachers.sessionId, userId: sessionTeachers.userId })
        .from(sessionTeachers)
        .where(inArray(sessionTeachers.sessionId, sessionIds))
    : [];

  const perSession: Record<string, string[]> = {};
  for (const s of sessions) perSession[s.id] = [];
  for (const row of sessionTeacherRows) {
    if (!perSession[row.sessionId]) perSession[row.sessionId] = [];
    perSession[row.sessionId].push(row.userId);
  }

  return {
    primaryTeacherId: course.primaryTeacherId,
    courseTeacherIds: courseTeacherRows.map((r) => r.userId),
    sessionTeachers: perSession,
  };
}

// ── ADMIN: Batch create sessions (multiple weeks) ──

export async function batchCreateSessions(input: {
  classCode: string;
  courseName: string;
  teacherId: string;
  coTeacherIds?: string[];
  weekCount: number;
  startDate: string;
  group?: string;
}) {
  // Look up by courseCode first (unique identifier), then by title as fallback
  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.courseCode, input.classCode));

  if (!course) {
    // Fallback: check by title + group combo to avoid accidental duplicates
    const titleMatches = await db
      .select()
      .from(courses)
      .where(eq(courses.title, input.courseName));
    const groupMatch = titleMatches.find(c => (c.group || null) === (input.group || null));
    if (groupMatch) course = groupMatch;
  }

  if (!course) {
    const slug =
      input.courseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 7);

    [course] = await db
      .insert(courses)
      .values({
        title: input.courseName,
        slug,
        courseCode: input.classCode,
        teacherId: input.teacherId,
        group: input.group || null,
        status: "PUBLISHED",
        approved: true,
      })
      .returning();
  } else {
    // Backfill courseCode/group on existing course if missing
    const updates: Record<string, unknown> = {};
    if (!course.courseCode) updates.courseCode = input.classCode;
    if (!course.group && input.group) updates.group = input.group;
    if (Object.keys(updates).length > 0) {
      [course] = await db.update(courses).set(updates).where(eq(courses.id, course.id)).returning();
    }
  }

  const sessions = [];
  const baseDate = new Date(input.startDate);

  // Pre-flight: check if any week codes already exist
  const weekCodes = Array.from({ length: input.weekCount }, (_, i) =>
    `${input.classCode}-W${String(i + 1).padStart(2, "0")}`
  );
  const existingCodes = await db
    .select({ classCode: classeSessions.classCode })
    .from(classeSessions)
    .where(inArray(classeSessions.classCode, weekCodes));

  if (existingCodes.length > 0) {
    const dupes = existingCodes.map(r => r.classCode).join(", ");
    throw new TRPCError({
      code: "CONFLICT",
      message: `Class code(s) already exist: ${dupes}. Use a different base code or delete the existing class first.`,
    });
  }

  for (let i = 0; i < input.weekCount; i++) {
    const weekNum = String(i + 1).padStart(2, "0");
    const scheduledAt = new Date(baseDate);
    scheduledAt.setDate(scheduledAt.getDate() + i * 7);

    const [session] = await db
      .insert(classeSessions)
      .values({
        classCode: `${input.classCode}-W${weekNum}`,
        courseId: course.id,
        teacherId: input.teacherId,
        title: `Week${weekNum}`,
        scheduledAt,
      })
      .returning();

    sessions.push(session);
  }

  // Seed join tables with the primary teacher + any co-teachers
  const allTeacherIds = new Set<string>([input.teacherId, ...(input.coTeacherIds ?? [])]);
  const teacherRows = Array.from(allTeacherIds);

  await db
    .insert(courseTeachers)
    .values(teacherRows.map((userId) => ({ courseId: course.id, userId })))
    .onConflictDoNothing({ target: [courseTeachers.courseId, courseTeachers.userId] });

  if (sessions.length) {
    const sessionTeacherRows = sessions.flatMap((s) =>
      teacherRows.map((userId) => ({ sessionId: s.id, userId }))
    );
    await db
      .insert(sessionTeachers)
      .values(sessionTeacherRows)
      .onConflictDoNothing({ target: [sessionTeachers.sessionId, sessionTeachers.userId] });
  }

  return { course, sessions };
}

// ── TEACHER: Get my assigned class sessions ──

export async function getTeacherSessions(teacherId: string) {
  interface TeacherSessionRow {
    id: string;
    classCode: string;
    title: string;
    courseTitle: string;
    scheduledAt: Date;
    studentCount: number;
    markedCount: number;
  }

  const sessions = await db.execute(sql`
    SELECT
      cs.id,
      cs.class_code AS "classCode",
      cs.title,
      c.title AS "courseTitle",
      cs.scheduled_at AS "scheduledAt",
      COALESCE(ec.cnt, 0)::int AS "studentCount",
      COALESCE(ac.cnt, 0)::int AS "markedCount"
    FROM class_sessions cs
    JOIN courses c ON c.id = cs.course_id
    LEFT JOIN (
      SELECT course_id, count(*) AS cnt FROM enrollments GROUP BY course_id
    ) ec ON ec.course_id = cs.course_id
    LEFT JOIN (
      SELECT session_id, count(*) AS cnt FROM attendance_records GROUP BY session_id
    ) ac ON ac.session_id = cs.id
    WHERE cs.teacher_id = ${teacherId}
    ORDER BY cs.scheduled_at DESC
  `);

  return typedRows<TeacherSessionRow>(sessions);
}

// ── TEACHER: Get sessions for a specific course ──

export async function getTeacherCourseSessions(courseId: string, teacherId: string) {
  interface CourseSessionRow {
    id: string;
    classCode: string;
    title: string;
    scheduledAt: Date;
    materialCount: number;
  }

  const sessions = await db.execute(sql`
    SELECT
      cs.id,
      cs.class_code AS "classCode",
      cs.title,
      cs.scheduled_at AS "scheduledAt",
      COALESCE(mc.cnt, 0)::int AS "materialCount"
    FROM class_sessions cs
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt FROM week_materials WHERE week_materials.session_id = cs.id
    ) mc ON true
    WHERE cs.course_id = ${courseId}
      AND cs.teacher_id = ${teacherId}
    ORDER BY cs.scheduled_at ASC
  `);

  return typedRows<CourseSessionRow>(sessions);
}

// ── TEACHER: Get whole course attendance report ──

export async function getTeacherCourseAttendanceReport(courseId: string, teacherId: string) {
  // Verify teacher owns at least one session in this course
  const [session] = await db
    .select()
    .from(classeSessions)
    .where(
      and(eq(classeSessions.courseId, courseId), eq(classeSessions.teacherId, teacherId))
    );

  if (!session) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not assigned to this course",
    });
  }

  const courseInfo = await db.execute(sql`SELECT title FROM courses WHERE id = ${courseId}`);

  const courseSessions = await db.execute(sql`
    SELECT
      cs.id,
      cs.class_code AS "classCode",
      cs.title,
      cs.scheduled_at AS "scheduledAt"
    FROM class_sessions cs
    WHERE cs.course_id = ${courseId} AND cs.teacher_id = ${teacherId}
    ORDER BY cs.scheduled_at ASC
  `);

  const enrolledStudents = await db.execute(sql`
    SELECT
      u.id AS "studentId",
      u.name AS "studentName",
      u.email AS "studentEmail"
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    WHERE e.course_id = ${courseId}
    ORDER BY u.name ASC
  `);

  const records = await db.execute(sql`
    SELECT
      ar.session_id AS "sessionId",
      ar.student_id AS "studentId",
      ar.attendance_date AS "attendanceDate",
      ar.status,
      ar.comments
    FROM attendance_records ar
    JOIN class_sessions cs ON cs.id = ar.session_id
    WHERE cs.course_id = ${courseId}
  `);

  return {
    courseTitle: (courseInfo[0] as any)?.title || "Course",
    sessions: typedRows<any>(courseSessions),
    students: typedRows<any>(enrolledStudents),
    attendance: typedRows<any>(records),
  };
}

// ── TEACHER: Get enrolled students for their course ──

export async function getTeacherCourseStudents(courseId: string, teacherId: string) {
  // Verify teacher owns this course (via at least one session)
  const [session] = await db
    .select()
    .from(classeSessions)
    .where(
      and(eq(classeSessions.courseId, courseId), eq(classeSessions.teacherId, teacherId))
    );

  if (!session) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not assigned to this course",
    });
  }

  interface EnrolledStudentRow {
    studentId: string;
    studentName: string;
    studentEmail: string;
    enrolledAt: Date;
  }

  const rows = await db.execute(sql`
    SELECT
      u.id AS "studentId",
      u.name AS "studentName",
      u.email AS "studentEmail",
      e.enrolled_at AS "enrolledAt"
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    WHERE e.course_id = ${courseId}
    ORDER BY u.name ASC
  `);

  return typedRows<EnrolledStudentRow>(rows);
}

// ── TEACHER: Get students for a session with their attendance status ──

export async function getSessionStudents(sessionId: string, teacherId: string, attendanceDate?: string) {
  // Verify teacher owns this session
  const [session] = await db
    .select()
    .from(classeSessions)
    .where(
      and(eq(classeSessions.id, sessionId), eq(classeSessions.teacherId, teacherId))
    );

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Session not found or you are not assigned to it",
    });
  }

  // Default date to today if not provided
  const dateFilter = attendanceDate || new Date().toISOString().slice(0, 10);

  interface StudentAttendanceRow {
    studentId: string;
    studentName: string;
    studentEmail: string;
    status: string | null;
    comments: string | null;
    markedAt: Date | null;
  }

  const students = await db.execute(sql`
    SELECT
      u.id AS "studentId",
      u.name AS "studentName",
      u.email AS "studentEmail",
      ar.status,
      ar.comments,
      ar.marked_at AS "markedAt"
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    LEFT JOIN attendance_records ar ON ar.session_id = ${sessionId} AND ar.student_id = u.id AND ar.attendance_date = ${dateFilter}
    WHERE e.course_id = ${session.courseId}
    ORDER BY u.name ASC
  `);

  return {
    session: {
      id: session.id,
      classCode: session.classCode,
      title: session.title,
      scheduledAt: session.scheduledAt,
    },
    students: typedRows<StudentAttendanceRow>(students),
  };
}

// ── TEACHER: Mark attendance for a student ──

export async function markAttendance(input: {
  sessionId: string;
  studentId: string;
  attendanceDate: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE";
  comments?: string;
  teacherId: string;
}) {
  // Verify teacher owns this session
  const [session] = await db
    .select()
    .from(classeSessions)
    .where(
      and(
        eq(classeSessions.id, input.sessionId),
        eq(classeSessions.teacherId, input.teacherId)
      )
    );

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Session not found or not assigned to you",
    });
  }

  // Upsert attendance record (unique per session + student + date)
  const [record] = await db
    .insert(attendanceRecords)
    .values({
      sessionId: input.sessionId,
      studentId: input.studentId,
      attendanceDate: input.attendanceDate,
      status: input.status,
      comments: input.comments,
      markedBy: input.teacherId,
    })
    .onConflictDoUpdate({
      target: [attendanceRecords.sessionId, attendanceRecords.studentId, attendanceRecords.attendanceDate],
      set: {
        status: input.status,
        comments: input.comments,
        markedBy: input.teacherId,
        markedAt: new Date(),
      },
    })
    .returning();

  return record;
}

// ── STUDENT: View own attendance history ──

export async function getStudentAttendance(studentId: string) {
  interface StudentAttendanceRow {
    sessionId: string;
    sessionTitle: string;
    classCode: string;
    courseTitle: string;
    scheduledAt: Date;
    status: string;
    markedAt: Date | null;
  }

  const records = await db.execute(sql`
    SELECT
      cs.id AS "sessionId",
      cs.title AS "sessionTitle",
      cs.class_code AS "classCode",
      c.title AS "courseTitle",
      cs.scheduled_at AS "scheduledAt",
      COALESCE(ar.status, 'UNMARKED') AS status,
      ar.marked_at AS "markedAt"
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    JOIN class_sessions cs ON cs.course_id = c.id
    LEFT JOIN attendance_records ar ON ar.session_id = cs.id AND ar.student_id = ${studentId}
    WHERE e.user_id = ${studentId}
    ORDER BY cs.scheduled_at DESC
  `);

  return typedRows<StudentAttendanceRow>(records);
}

// ── MATERIALS: CRUD for week materials ──

export async function getSessionMaterials(sessionId: string) {
  return db
    .select()
    .from(weekMaterials)
    .where(eq(weekMaterials.sessionId, sessionId))
    .orderBy(weekMaterials.position);
}

export async function addMaterial(input: {
  sessionId: string;
  type: "ASSIGNMENT" | "PDF" | "LINK" | "EXAM";
  title: string;
  description?: string;
  url?: string;
  dueDate?: string;
}) {
  // Get next position
  const existing = await db
    .select({ count: count() })
    .from(weekMaterials)
    .where(eq(weekMaterials.sessionId, input.sessionId));
  const position = existing[0]?.count ?? 0;

  const [material] = await db
    .insert(weekMaterials)
    .values({
      sessionId: input.sessionId,
      type: input.type,
      title: input.title,
      description: input.description || null,
      url: input.url || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      position,
    })
    .returning();

  return material;
}

export async function deleteMaterial(materialId: string) {
  await db.delete(weekMaterials).where(eq(weekMaterials.id, materialId));
  return { success: true };
}

// ── ADMIN: Get enrolled students for a course ──

export async function getCourseStudents(courseId: string) {
  interface EnrolledStudent {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    enrolledAt: Date;
  }

  const rows = await db.execute(sql`
    SELECT
      e.id AS "enrollmentId",
      u.id AS "studentId",
      u.name AS "studentName",
      u.email AS "studentEmail",
      e.enrolled_at AS "enrolledAt"
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    WHERE e.course_id = ${courseId}
    ORDER BY u.name ASC
  `);

  return typedRows<EnrolledStudent>(rows);
}

// ── ADMIN: Enroll a student in a course ──

export async function enrollStudent(courseId: string, studentId: string) {
  // Check if already enrolled
  const [existing] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, studentId), eq(enrollments.courseId, courseId)));

  if (existing) {
    // Already enrolled — return the existing enrollment instead of throwing
    return existing;
  }

  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId: studentId, courseId })
    .returning();

  return enrollment;
}

// ── ADMIN: Batch enroll multiple students in a course (single round-trip) ──

export async function batchEnrollStudents(courseId: string, studentIds: string[]) {
  if (!studentIds.length) return { enrolled: 0 };

  const values = studentIds.map((userId) => ({ userId, courseId }));
  const inserted = await db
    .insert(enrollments)
    .values(values)
    .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] })
    .returning({ id: enrollments.id });

  return { enrolled: inserted.length };
}

// ── ADMIN: Unenroll a student from a course ──

export async function unenrollStudent(enrollmentId: string) {
  await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));
  return { success: true };
}
