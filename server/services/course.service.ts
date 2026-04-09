import "server-only";
import { TRPCError } from "@trpc/server";
import { eq, and, isNull, desc, asc, sql, ilike, count, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { courses, categories, modules, lessons } from "@/server/db/schema/courses";
import { enrollments } from "@/server/db/schema/learning";
import { reviews } from "@/server/db/schema/social";
import { users } from "@/server/db/schema/users";
import { classeSessions, weekMaterials } from "@/server/db/schema/attendance";
import { slugify } from "@/lib/utils";
import type { CreateCourseInput, UpdateCourseInput, CourseListInput } from "@/lib/validations/course";

export async function getCategories() {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.name));
}

export async function createCourse(teacherId: string, input: CreateCourseInput) {
  const slug = slugify(input.title) + "-" + Date.now().toString(36);
  const [course] = await db
    .insert(courses)
    .values({
      title: input.title,
      slug,
      description: input.description,
      categoryId: input.categoryId,
      thumbnail: input.thumbnail,

      teacherId,
    })
    .returning({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
    });
  return course;
}

export async function updateCourse(
  teacherId: string,
  role: string,
  input: UpdateCourseInput
) {
  const [existing] = await db
    .select({ teacherId: courses.teacherId })
    .from(courses)
    .where(and(eq(courses.id, input.id), isNull(courses.deletedAt)));

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }
  if (existing.teacherId !== teacherId && role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not the course owner" });
  }

  const { id, ...data } = input;
  // #8: Auto-filter undefined fields — no manual if-chains to maintain
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const [updated] = await db
    .update(courses)
    .set(updateData)
    .where(eq(courses.id, id))
    .returning({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      status: courses.status,
    });
  return updated;
}

export async function publishCourse(courseId: string, teacherId: string, role: string) {
  const [existing] = await db
    .select({ teacherId: courses.teacherId })
    .from(courses)
    .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)));

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }
  if (existing.teacherId !== teacherId && role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not the course owner" });
  }

  const lessonCount = await db
    .select({ count: count() })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));

  if (!lessonCount[0] || lessonCount[0].count === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot publish a course with no lessons",
    });
  }

  const [updated] = await db
    .update(courses)
    .set({ status: "PUBLISHED" })
    .where(eq(courses.id, courseId))
    .returning({ id: courses.id, status: courses.status });
  return updated;
}

export async function deleteCourse(courseId: string, teacherId: string, role: string) {
  const [existing] = await db
    .select({ teacherId: courses.teacherId })
    .from(courses)
    .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)));

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }
  if (existing.teacherId !== teacherId && role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not the course owner" });
  }

  await db
    .update(courses)
    .set({ deletedAt: new Date() })
    .where(eq(courses.id, courseId));
  return { success: true };
}

export async function getCatalog(input: CourseListInput) {
  const conditions = [
    isNull(courses.deletedAt),
    eq(courses.status, "PUBLISHED"),
  ];

  if (input.categoryId) {
    conditions.push(eq(courses.categoryId, input.categoryId));
  }
  if (input.search) {
    conditions.push(
      sql`to_tsvector('english', ${courses.title} || ' ' || coalesce(${courses.description}, '')) @@ plainto_tsquery('english', ${input.search})`
    );
  }

  const orderBy =
    input.sort === "newest"
      ? desc(courses.createdAt)
      : input.sort === "popular"
        ? desc(
            sql`(SELECT count(*) FROM enrollments WHERE enrollments.course_id = courses.id)`
          )
        : desc(
            sql`(SELECT coalesce(avg(rating), 0) FROM reviews WHERE reviews.course_id = courses.id)`
          );

  const [courseList, totalResult] = await Promise.all([
    db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        description: courses.description,
        thumbnail: courses.thumbnail,

        totalDuration: courses.totalDuration,
        teacherName: users.name,
        teacherAvatar: users.avatar,
        categoryName: categories.name,
        categorySlug: categories.slug,
        createdAt: courses.createdAt,
        avgRating: sql<number>`coalesce((SELECT avg(rating) FROM reviews WHERE reviews.course_id = courses.id), 0)`,
        enrollmentCount: sql<number>`(SELECT count(*) FROM enrollments WHERE enrollments.course_id = courses.id)`,
      })
      .from(courses)
      .leftJoin(users, eq(courses.teacherId, users.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(input.limit)
      .offset(input.offset),
    db
      .select({ count: count() })
      .from(courses)
      .where(and(...conditions)),
  ]);

  return {
    courses: courseList,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function getCourseBySlug(slug: string, userId?: string) {
  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      thumbnail: courses.thumbnail,

      status: courses.status,
      totalDuration: courses.totalDuration,
      teacherId: courses.teacherId,
      teacherName: users.name,
      teacherAvatar: users.avatar,
      teacherBio: users.bio,
      categoryName: categories.name,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .leftJoin(users, eq(courses.teacherId, users.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(and(eq(courses.slug, slug), isNull(courses.deletedAt)));

  if (!course) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  const [courseModules, avgRatingResult, enrollmentCountResult, isEnrolled, courseSessionsResult] =
    await Promise.all([
      db
        .select({
          id: modules.id,
          title: modules.title,
          position: modules.position,
        })
        .from(modules)
        .where(eq(modules.courseId, course.id))
        .orderBy(asc(modules.position)),
      db
        .select({ avg: sql<number>`coalesce(avg(${reviews.rating}), 0)` })
        .from(reviews)
        .where(eq(reviews.courseId, course.id)),
      db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.courseId, course.id)),
      userId
        ? db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(
              and(
                eq(enrollments.userId, userId),
                eq(enrollments.courseId, course.id)
              )
            )
        : Promise.resolve([]),
      db
        .select({
          id: classeSessions.id,
          title: classeSessions.title,
          classCode: classeSessions.classCode,
          scheduledAt: classeSessions.scheduledAt,
        })
        .from(classeSessions)
        .where(eq(classeSessions.courseId, course.id))
        .orderBy(asc(classeSessions.scheduledAt)),
    ]);

  // Fetch all lessons for this course in ONE query (fixes N+1)
  const allLessons = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      duration: lessons.duration,
      position: lessons.position,
      isFree: lessons.isFree,
      moduleId: lessons.moduleId,
    })
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));

  // Group lessons by module
  const lessonsByModule = new Map<string, typeof allLessons>();
  for (const lesson of allLessons) {
    const existing = lessonsByModule.get(lesson.moduleId) ?? [];
    existing.push(lesson);
    lessonsByModule.set(lesson.moduleId, existing);
  }

  const modulesWithLessons = courseModules.map((mod) => ({
    ...mod,
    lessons: lessonsByModule.get(mod.id) ?? [],
  }));

  // Fetch materials for all sessions of this course
  const sessionIds = courseSessionsResult.map((s) => s.id);
  const allMaterials = sessionIds.length > 0
    ? await db
        .select({
          id: weekMaterials.id,
          sessionId: weekMaterials.sessionId,
          title: weekMaterials.title,
          type: weekMaterials.type,
          url: weekMaterials.url,
          position: weekMaterials.position,
        })
        .from(weekMaterials)
        .where(inArray(weekMaterials.sessionId, sessionIds))
        .orderBy(asc(weekMaterials.position))
    : [];

  const materialsBySession = new Map<string, typeof allMaterials>();
  for (const mat of allMaterials) {
    const existing = materialsBySession.get(mat.sessionId) ?? [];
    existing.push(mat);
    materialsBySession.set(mat.sessionId, existing);
  }

  const sessionsWithMaterials = courseSessionsResult.map((session) => ({
    ...session,
    materials: materialsBySession.get(session.id) ?? [],
  }));

  return {
    ...course,
    modules: modulesWithLessons,
    sessions: sessionsWithMaterials,
    avgRating: Number(avgRatingResult[0]?.avg ?? 0),
    enrollmentCount: enrollmentCountResult[0]?.count ?? 0,
    isEnrolled: isEnrolled.length > 0,
  };
}

export async function getTeacherCourses(teacherId: string) {
  const courseList = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      status: courses.status,
      thumbnail: courses.thumbnail,
      createdAt: courses.createdAt,
      enrollmentCount: sql<number>`(SELECT count(*) FROM enrollments WHERE enrollments.course_id = courses.id)`,
    })
    .from(courses)
    .where(and(eq(courses.teacherId, teacherId), isNull(courses.deletedAt)))
    .orderBy(desc(courses.createdAt));

  return courseList;
}
