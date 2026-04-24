import "server-only";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { scheduleEvents } from "@/server/db/schema/schedules";
import { courses } from "@/server/db/schema/courses";
import { enrollments } from "@/server/db/schema/learning";
import { users } from "@/server/db/schema/users";
import { createNotification } from "./notification.service";

// ── Get schedules for a specific course ──
export async function getCourseSchedules(courseId: string) {
  return db
    .select({
      id: scheduleEvents.id,
      courseId: scheduleEvents.courseId,
      moduleId: scheduleEvents.moduleId,
      createdBy: scheduleEvents.createdBy,
      title: scheduleEvents.title,
      description: scheduleEvents.description,
      room: scheduleEvents.room,
      eventType: scheduleEvents.eventType,
      classType: scheduleEvents.classType,
      startTime: scheduleEvents.startTime,
      endTime: scheduleEvents.endTime,
    })
    .from(scheduleEvents)
    .where(eq(scheduleEvents.courseId, courseId))
    .orderBy(scheduleEvents.startTime);
}

// ── Get all schedules for a user (student = enrolled courses, teacher = own courses, admin = all) ──
export async function getUserSchedules(
  userId: string,
  role: "ADMIN" | "TEACHER" | "STUDENT"
) {
  if (role === "ADMIN") {
    // Admin sees everything across the LMS
    return db
      .select({
        id: scheduleEvents.id,
        courseId: scheduleEvents.courseId,
        courseTitle: courses.title,
        moduleId: scheduleEvents.moduleId,
        createdBy: scheduleEvents.createdBy,
        title: scheduleEvents.title,
        description: scheduleEvents.description,
        room: scheduleEvents.room,
        eventType: scheduleEvents.eventType,
        classType: scheduleEvents.classType,
        startTime: scheduleEvents.startTime,
        endTime: scheduleEvents.endTime,
      })
      .from(scheduleEvents)
      .innerJoin(courses, eq(courses.id, scheduleEvents.courseId))
      .orderBy(scheduleEvents.startTime);
  }

  if (role === "TEACHER") {
    // Teacher sees schedules for courses they teach
    return db
      .select({
        id: scheduleEvents.id,
        courseId: scheduleEvents.courseId,
        courseTitle: courses.title,
        moduleId: scheduleEvents.moduleId,
        createdBy: scheduleEvents.createdBy,
        title: scheduleEvents.title,
        description: scheduleEvents.description,
        room: scheduleEvents.room,
        eventType: scheduleEvents.eventType,
        classType: scheduleEvents.classType,
        startTime: scheduleEvents.startTime,
        endTime: scheduleEvents.endTime,
      })
      .from(scheduleEvents)
      .innerJoin(courses, eq(courses.id, scheduleEvents.courseId))
      .where(eq(courses.teacherId, userId))
      .orderBy(scheduleEvents.startTime);
  }

  // Student sees schedules for enrolled courses only
  const enrolled = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.userId, userId));

  const courseIds = enrolled.map((e) => e.courseId);
  if (!courseIds.length) return [];

  return db
    .select({
      id: scheduleEvents.id,
      courseId: scheduleEvents.courseId,
      courseTitle: courses.title,
      moduleId: scheduleEvents.moduleId,
      createdBy: scheduleEvents.createdBy,
      title: scheduleEvents.title,
      description: scheduleEvents.description,
      room: scheduleEvents.room,
      eventType: scheduleEvents.eventType,
      classType: scheduleEvents.classType,
      startTime: scheduleEvents.startTime,
      endTime: scheduleEvents.endTime,
    })
    .from(scheduleEvents)
    .innerJoin(courses, eq(courses.id, scheduleEvents.courseId))
    .where(inArray(scheduleEvents.courseId, courseIds))
    .orderBy(scheduleEvents.startTime);
}

// ── Create a schedule event ──
export async function createScheduleEvent(input: {
  courseId: string;
  moduleId?: string;
  createdBy: string;
  title: string;
  description?: string;
  room?: string;
  eventType: "LIVE_CLASS" | "ASSIGNMENT" | "QA_SESSION" | "MILESTONE" | "CUSTOM";
  classType?: "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION";
  startTime: string;
  endTime: string;
}) {
  // Verify the course exists
  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(eq(courses.id, input.courseId));

  if (!course) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  const [event] = await db
    .insert(scheduleEvents)
    .values({
      courseId: input.courseId,
      moduleId: input.moduleId || null,
      createdBy: input.createdBy,
      title: input.title,
      description: input.description || null,
      room: input.room || null,
      eventType: input.eventType,
      classType: input.classType || "LECTURE",
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
    })
    .returning();

  return event;
}

// ── Update a schedule event (drag and drop) ──
export async function updateScheduleEvent(input: {
  eventId: string;
  userId: string;
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  title?: string;
  description?: string;
  room?: string;
  eventType?: "LIVE_CLASS" | "ASSIGNMENT" | "QA_SESSION" | "MILESTONE" | "CUSTOM";
  classType?: "LECTURE" | "LAB" | "MAKEUP_CLASS" | "ONLINE_SESSION";
  startTime?: string;
  endTime?: string;
}) {
  const [existing] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, input.eventId));

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Schedule event not found" });
  }

  if (input.userRole !== "ADMIN" && existing.createdBy !== input.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to modify this schedule event",
    });
  }

  const effectiveStart = input.startTime ? new Date(input.startTime) : existing.startTime;
  const effectiveEnd = input.endTime ? new Date(input.endTime) : existing.endTime;
  if (effectiveEnd <= effectiveStart) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "End time must be after start time",
    });
  }

  const updateData: Record<string, unknown> = {};
  if (input.title) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.room !== undefined) updateData.room = input.room;
  if (input.eventType) updateData.eventType = input.eventType;
  if (input.classType) updateData.classType = input.classType;
  if (input.startTime) updateData.startTime = new Date(input.startTime);
  if (input.endTime) updateData.endTime = new Date(input.endTime);

  const [updated] = await db
    .update(scheduleEvents)
    .set(updateData)
    .where(eq(scheduleEvents.id, input.eventId))
    .returning();

  // Send notifications to enrolled students if time was changed
  if (input.startTime || input.endTime) {
    await notifyEnrolledStudents(
      existing.courseId,
      `Schedule Changed: ${updated.title}`,
      `"${updated.title}" has been rescheduled to ${new Date(updated.startTime).toLocaleString()}.`
    );
  }

  return updated;
}

// ── Delete a schedule event ──
export async function deleteScheduleEvent(
  eventId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER" | "STUDENT"
) {
  const [existing] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, eventId));

  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Schedule event not found" });
  }

  if (userRole !== "ADMIN" && existing.createdBy !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to delete this schedule event",
    });
  }

  // Notify students before deleting
  await notifyEnrolledStudents(
    existing.courseId,
    `Schedule Cancelled: ${existing.title}`,
    `The scheduled event "${existing.title}" has been cancelled.`
  );

  await db.delete(scheduleEvents).where(eq(scheduleEvents.id, eventId));
  return { success: true };
}

// ── Internal: notify all enrolled students of a course ──
async function notifyEnrolledStudents(
  courseId: string,
  title: string,
  body: string
) {
  const enrolled = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));

  const promises = enrolled.map((e) =>
    createNotification(e.userId, "SCHEDULE_CHANGE", title, body)
  );

  await Promise.allSettled(promises);
}
