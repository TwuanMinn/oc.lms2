import { z } from "zod";
import { router, protectedProcedure, teacherProcedure, adminProcedure } from "@/server/trpc";
import * as scheduleService from "@/server/services/schedule.service";
import { db } from "@/server/db";
import { courses } from "@/server/db/schema/courses";
import { users } from "@/server/db/schema/users";
import { eq, isNull } from "drizzle-orm";

const eventTypeEnum = z.enum(["LIVE_CLASS", "ASSIGNMENT", "QA_SESSION", "MILESTONE", "CUSTOM"]);
const classTypeEnum = z.enum(["LECTURE", "LAB", "MAKEUP_CLASS", "ONLINE_SESSION"]);

export const scheduleRouter = router({
  // ── Get schedules for a specific course ──
  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ input }) => {
      return scheduleService.getCourseSchedules(input.courseId);
    }),

  // ── Get all schedules for the current user (role-aware) ──
  getMySchedules: protectedProcedure.query(async ({ ctx }) => {
    return scheduleService.getUserSchedules(
      ctx.user.id,
      ctx.user.role as "ADMIN" | "TEACHER" | "STUDENT"
    );
  }),

  // ── Lightweight course list for admin schedule sidebar ──
  allCourses: adminProcedure.query(async () => {
    return db
      .select({
        id: courses.id,
        title: courses.title,
        courseCode: courses.courseCode,
        group: courses.group,
        teacherName: users.name,
        startDate: courses.startDate,
      })
      .from(courses)
      .leftJoin(users, eq(courses.teacherId, users.id))
      .where(isNull(courses.deletedAt))
      .orderBy(courses.title);
  }),

  // ── Create a schedule event (Teacher/Admin) ──
  create: teacherProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        moduleId: z.string().uuid().optional(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        room: z.string().optional(),
        eventType: eventTypeEnum.default("LIVE_CLASS"),
        classType: classTypeEnum.default("LECTURE"),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
      }).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
        message: "End time must be after start time",
        path: ["endTime"],
      })
    )
    .mutation(async ({ input, ctx }) => {
      return scheduleService.createScheduleEvent({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // ── Update a schedule event (drag-and-drop reschedule) ──
  update: teacherProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        room: z.string().optional(),
        eventType: eventTypeEnum.optional(),
        classType: classTypeEnum.optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return scheduleService.updateScheduleEvent({
        ...input,
        userId: ctx.user.id,
        userRole: ctx.user.role as "ADMIN" | "TEACHER" | "STUDENT",
      });
    }),

  // ── Delete a schedule event ──
  delete: teacherProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return scheduleService.deleteScheduleEvent(
        input.eventId,
        ctx.user.id,
        ctx.user.role as "ADMIN" | "TEACHER" | "STUDENT"
      );
    }),
});
