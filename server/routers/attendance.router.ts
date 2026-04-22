import { z } from "zod";
import { router, adminProcedure, teacherProcedure, protectedProcedure } from "@/server/trpc";
import * as attendanceService from "@/server/services/attendance.service";

export const attendanceRouter = router({
  // ── Admin: Create class session ──
  createSession: adminProcedure
    .input(
      z.object({
        classCode: z.string().min(1, "Class code is required"),
        courseName: z.string().min(1, "Course name is required"),
        teacherId: z.string().uuid(),
        coTeacherIds: z.array(z.string().uuid()).optional(),
        title: z.string().min(1, "Title is required"),
        scheduledAt: z.string().min(1, "Schedule time is required"),
        group: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return attendanceService.createClassSession(input);
    }),

  // ── Admin: Batch create sessions (multiple weeks) ──
  batchCreateSessions: adminProcedure
    .input(
      z.object({
        classCode: z.string().min(1, "Class code is required"),
        courseName: z.string().min(1, "Course name is required"),
        teacherId: z.string().uuid(),
        coTeacherIds: z.array(z.string().uuid()).optional(),
        weekCount: z.number().min(1).max(52),
        startDate: z.string().min(1, "Start date is required"),
        group: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return attendanceService.batchCreateSessions(input);
    }),

  // ── Admin: List all sessions ──
  getSessions: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return attendanceService.getClassSessions(input);
    }),

  // ── Admin: Delete session ──
  deleteSession: adminProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return attendanceService.deleteClassSession(input.sessionId);
    }),

  // ── Admin: Update session (title / scheduled time / teachers) ──
  updateSession: adminProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      title: z.string().min(1).optional(),
      scheduledAt: z.string().min(1).optional(),
      primaryTeacherId: z.string().uuid().optional(),
      teacherIds: z.array(z.string().uuid()).optional(),
    }))
    .mutation(async ({ input }) => {
      return attendanceService.updateClassSession(input);
    }),

  // ── Admin: Update course meta (title / primary teacher / co-teachers / group) ──
  updateCourseMeta: adminProcedure
    .input(z.object({
      courseId: z.string().uuid(),
      title: z.string().min(1).optional(),
      teacherId: z.string().uuid().optional(),
      teacherIds: z.array(z.string().uuid()).optional(),
      group: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      return attendanceService.updateCourseMeta(input);
    }),

  // ── Admin: Get teacher assignments for a course + its sessions ──
  getTeacherAssignments: adminProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ input }) => {
      return attendanceService.getCourseTeacherAssignments(input.courseId);
    }),

  // ── Teacher: Get my sessions ──
  getTeacherSessions: teacherProcedure.query(async ({ ctx }) => {
    return attendanceService.getTeacherSessions(ctx.user.id);
  }),

  // ── Teacher: Get sessions for a specific course ──
  getTeacherCourseSessions: teacherProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return attendanceService.getTeacherCourseSessions(input.courseId, ctx.user.id);
    }),

  // ── Teacher: Get whole course attendance report ──
  getTeacherCourseAttendanceReport: teacherProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return attendanceService.getTeacherCourseAttendanceReport(input.courseId, ctx.user.id);
    }),

  // ── Teacher: Get enrolled students for their course ──
  getTeacherCourseStudents: teacherProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return attendanceService.getTeacherCourseStudents(input.courseId, ctx.user.id);
    }),

  // ── Teacher: Get students for a session ──
  getSessionStudents: teacherProcedure
    .input(z.object({ sessionId: z.string().uuid(), attendanceDate: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      return attendanceService.getSessionStudents(input.sessionId, ctx.user.id, input.attendanceDate);
    }),

  // ── Teacher: Mark attendance ──
  markAttendance: teacherProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        studentId: z.string().uuid(),
        attendanceDate: z.string().min(1),
        status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return attendanceService.markAttendance({
        ...input,
        teacherId: ctx.user.id,
      });
    }),

  // ── Materials: Get materials for a session ──
  getSessionMaterials: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input }) => {
      return attendanceService.getSessionMaterials(input.sessionId);
    }),

  // ── Materials: Add a material to a session ──
  addMaterial: teacherProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        type: z.enum(["ASSIGNMENT", "PDF", "LINK", "EXAM"]),
        title: z.string().min(1),
        description: z.string().optional(),
        url: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return attendanceService.addMaterial(input);
    }),

  // ── Materials: Delete a material ──
  deleteMaterial: teacherProcedure
    .input(z.object({ materialId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return attendanceService.deleteMaterial(input.materialId);
    }),

  // ── Admin: Get enrolled students for a course ──
  getCourseStudents: adminProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .query(async ({ input }) => {
      return attendanceService.getCourseStudents(input.courseId);
    }),

  // ── Admin: Enroll a student in a course ──
  enrollStudent: adminProcedure
    .input(z.object({
      courseId: z.string().uuid(),
      studentId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      return attendanceService.enrollStudent(input.courseId, input.studentId);
    }),

  // ── Admin: Batch enroll multiple students (single DB round-trip) ──
  batchEnrollStudents: adminProcedure
    .input(z.object({
      courseId: z.string().uuid(),
      studentIds: z.array(z.string().uuid()).min(1).max(500),
    }))
    .mutation(async ({ input }) => {
      return attendanceService.batchEnrollStudents(input.courseId, input.studentIds);
    }),

  // ── Admin: Unenroll a student from a course ──
  unenrollStudent: adminProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return attendanceService.unenrollStudent(input.enrollmentId);
    }),

  // ── Student: View own attendance history ──
  getStudentAttendance: protectedProcedure.query(async ({ ctx }) => {
    return attendanceService.getStudentAttendance(ctx.user.id);
  }),
});
