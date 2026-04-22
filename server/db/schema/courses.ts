import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const courseStatusEnum = pgEnum("course_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    courseCode: text("course_code").unique(),
    description: text("description"),
    thumbnail: text("thumbnail"),
    status: courseStatusEnum("status").notNull().default("DRAFT"),
    approved: boolean("approved").notNull().default(false),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    group: text("group"),
    startDate: timestamp("start_date", { withTimezone: true }),
    totalDuration: integer("total_duration").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_courses_teacher").on(table.teacherId),
    index("idx_courses_category").on(table.categoryId),
    index("idx_courses_status").on(table.status),
  ]
);

// #19: Added idx_modules_course — modules are frequently queried by courseId
export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_modules_course").on(table.courseId)]
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    videoUrl: text("video_url"),
    content: text("content"),
    duration: integer("duration").notNull().default(0),
    position: integer("position").notNull(),
    isFree: boolean("is_free").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_lessons_module").on(table.moduleId),
    index("idx_lessons_course").on(table.courseId),
  ]
);

// Weekly progress structure defined by admin
export const courseWeeks = pgTable(
  "course_weeks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_course_week").on(table.courseId, table.weekNumber),
    index("idx_course_weeks_course").on(table.courseId),
  ]
);

// Co-teachers for a course (primary teacher is courses.teacherId; this table
// holds the full set including primary so multi-select UIs have one source of truth)
export const courseTeachers = pgTable(
  "course_teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_course_teacher").on(table.courseId, table.userId),
    index("idx_course_teachers_course").on(table.courseId),
    index("idx_course_teachers_user").on(table.userId),
  ]
);

export type CourseTeacher = typeof courseTeachers.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type CourseWeek = typeof courseWeeks.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type NewModule = typeof modules.$inferInsert;
export type NewLesson = typeof lessons.$inferInsert;
export type NewCourseWeek = typeof courseWeeks.$inferInsert;
