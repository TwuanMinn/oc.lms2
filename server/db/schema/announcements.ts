import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const announcementCategoryEnum = pgEnum("announcement_category", [
  "EVENT_DEADLINE",
  "HOMEWORK",
  "SCHOOL_NEWS",
  "GENERAL",
]);

export const announcementPriorityEnum = pgEnum("announcement_priority", [
  "NORMAL",
  "URGENT",
]);

export const announcementStatusEnum = pgEnum("announcement_status", [
  "APPROVED",
  "PENDING",
  "REJECTED",
]);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role").notNull(), // ADMIN, TEACHER, STUDENT
    title: text("title").notNull(),
    message: text("message").notNull(),
    category: announcementCategoryEnum("category").notNull().default("GENERAL"),
    priority: announcementPriorityEnum("priority").notNull().default("NORMAL"),
    status: announcementStatusEnum("status").notNull().default("APPROVED"),
    audience: text("audience").notNull().default("ALL"), // ALL, TEACHERS, Grade 10, Grade 11, etc.
    isPinned: boolean("is_pinned").notNull().default(false),
    dueDate: timestamp("due_date", { withTimezone: true }),
    attachmentLabel: text("attachment_label"),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_announcements_author").on(table.authorId),
    index("idx_announcements_status").on(table.status),
    index("idx_announcements_category").on(table.category),
    index("idx_announcements_pinned").on(table.isPinned),
    index("idx_announcements_created").on(table.createdAt),
  ]
);

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
