import { z } from "zod";
import { router, protectedProcedure, teacherProcedure, adminProcedure } from "@/server/trpc";
import * as announcementService from "@/server/services/announcement.service";

const categoryEnum = z.enum(["EVENT_DEADLINE", "HOMEWORK", "SCHOOL_NEWS", "GENERAL"]);
const priorityEnum = z.enum(["NORMAL", "URGENT"]);

export const announcementRouter = router({
  // List all approved announcements (any authenticated user)
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const role = ctx.user.role as string;
      console.log("[TRPC] list Announcements called by user role:", role);
      // Students only see approved posts; admins/teachers see all
      const status = role === "STUDENT" ? "APPROVED" : input?.status;
      return announcementService.listAnnouncements({
        status,
        category: input?.category,
        search: input?.search,
      });
    }),

  // Create announcement
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        message: z.string().min(1, "Message is required"),
        category: categoryEnum.default("GENERAL"),
        priority: priorityEnum.default("NORMAL"),
        audience: z.string().default("ALL"),
        isPinned: z.boolean().default(false),
        dueDate: z.string().optional(),
        attachmentLabel: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user.role as string;
      // Students require approval; admins/teachers auto-approve
      const status = role === "STUDENT" ? "PENDING" : "APPROVED";
      return announcementService.createAnnouncement({
        ...input,
        authorId: ctx.user.id,
        authorName: ctx.user.name,
        authorRole: role,
        status: status as any,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
    }),

  // Update announcement (author, teacher, or admin)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        message: z.string().optional(),
        category: categoryEnum.optional(),
        priority: priorityEnum.optional(),
        audience: z.string().optional(),
        isPinned: z.boolean().optional(),
        dueDate: z.string().nullable().optional(),
        attachmentLabel: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await announcementService.getAnnouncementById(input.id);
      if (!existing) throw new Error("Announcement not found");
      const role = ctx.user.role as string;
      const isOwner = existing.authorId === ctx.user.id;
      if (!isOwner && role === "STUDENT") throw new Error("Not authorized");
      const { id, dueDate, ...rest } = input;
      return announcementService.updateAnnouncement(id, {
        ...rest,
        dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
      });
    }),

  // Delete announcement
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await announcementService.getAnnouncementById(input.id);
      if (!existing) throw new Error("Announcement not found");
      const role = ctx.user.role as string;
      const isOwner = existing.authorId === ctx.user.id;
      if (!isOwner && role === "STUDENT") throw new Error("Not authorized");
      return announcementService.deleteAnnouncement(input.id);
    }),

  // Approve a pending announcement (admin or teacher only)
  approve: teacherProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return announcementService.approveAnnouncement(input.id);
    }),

  // Reject a pending announcement (admin or teacher only)
  reject: teacherProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return announcementService.rejectAnnouncement(input.id);
    }),

  // Increment view count
  view: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return announcementService.incrementViewCount(input.id);
    }),

  // Bulk approve multiple pending announcements (admin or teacher only)
  bulkApprove: teacherProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.ids.map(id => announcementService.approveAnnouncement(id))
      );
      return { approved: results.length };
    }),
});
