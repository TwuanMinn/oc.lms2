import "server-only";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "@/server/db";
import { classeSessions, attendanceRecords, weekMaterials } from "@/server/db/schema/attendance";
import { users } from "@/server/db/schema/users";
import { courses } from "@/server/db/schema/courses";
import { enrollments } from "@/server/db/schema/learning";
import { TRPCError } from "@trpc/server";
import { typedRows } from "@/lib/utils";

// ── ADMIN: Create a class session ──

export async function createClassSession(input: {
  classCode: string;
  courseName: string;
  teacherId: string;
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
        COALESCE(ec.cnt, 0)::int AS "studentCount"
      FROM class_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN users u ON u.id = cs.teacher_id
      LEFT JOIN LATERAL (
        SELECT count(*) AS cnt FROM enrollments WHERE enrollments.course_id = cs.course_id
      ) ec ON true
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

// ── ADMIN: Batch create sessions (multiple weeks) ──

export async function batchCreateSessions(input: {
  classCode: string;
  courseName: string;
  teacherId: string;
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
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt FROM enrollments WHERE enrollments.course_id = cs.course_id
    ) ec ON true
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt FROM attendance_records WHERE attendance_records.session_id = cs.id
    ) ac ON true
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
  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId: studentId, courseId })
    .onConflictDoNothing()
    .returning();

  if (!enrollment) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Student is already enrolled in this course",
    });
  }

  return enrollment;
}

// ── ADMIN: Unenroll a student from a course ──

export async function unenrollStudent(enrollmentId: string) {
  await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));
  return { success: true };
}
