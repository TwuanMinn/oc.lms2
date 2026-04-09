import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  index,
  unique,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PRESENT",
  "LATE",
  "ABSENT",
  "LEAVE",
]);

export const materialTypeEnum = pgEnum("material_type", [
  "ASSIGNMENT",
  "PDF",
  "LINK",
  "EXAM",
]);

// A scheduled class session created by admin
export const classeSessions = pgTable(
  "class_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classCode: text("class_code").notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_class_sessions_teacher").on(table.teacherId),
    index("idx_class_sessions_course").on(table.courseId),
    unique("uq_class_code").on(table.classCode),
  ]
);

// Attendance record per student per class session
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => classeSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date").notNull(),
    status: attendanceStatusEnum("status").notNull().default("ABSENT"),
    comments: text("comments"),
    markedBy: uuid("marked_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    markedAt: timestamp("marked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("uq_attendance_record").on(table.sessionId, table.studentId, table.attendanceDate),
    index("idx_attendance_session").on(table.sessionId),
    index("idx_attendance_student").on(table.studentId),
  ]
);

// Materials (assignments, PDFs, links) attached to a week/session
export const weekMaterials = pgTable(
  "week_materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => classeSessions.id, { onDelete: "cascade" }),
    type: materialTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_week_materials_session").on(table.sessionId),
  ]
);

export type ClassSession = typeof classeSessions.$inferSelect;
export type NewClassSession = typeof classeSessions.$inferInsert;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert;
export type WeekMaterial = typeof weekMaterials.$inferSelect;
export type NewWeekMaterial = typeof weekMaterials.$inferInsert;
