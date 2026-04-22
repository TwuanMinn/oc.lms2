-- Multi-teacher assignment: course-level and per-session join tables.
-- courses.teacher_id and class_sessions.teacher_id remain as the "primary" teacher
-- for backward-compatible permissions. These tables hold the full teacher set.

CREATE TABLE IF NOT EXISTS "course_teachers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "uq_course_teacher" UNIQUE ("course_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_course_teachers_course" ON "course_teachers" ("course_id");
CREATE INDEX IF NOT EXISTS "idx_course_teachers_user"   ON "course_teachers" ("user_id");

CREATE TABLE IF NOT EXISTS "session_teachers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "class_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "uq_session_teacher" UNIQUE ("session_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_session_teachers_session" ON "session_teachers" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_session_teachers_user"    ON "session_teachers" ("user_id");

-- Backfill: every existing course has its primary teacher in course_teachers,
-- and every existing session has its primary teacher in session_teachers.
INSERT INTO "course_teachers" ("course_id", "user_id")
SELECT "id", "teacher_id" FROM "courses"
ON CONFLICT ("course_id", "user_id") DO NOTHING;

INSERT INTO "session_teachers" ("session_id", "user_id")
SELECT "id", "teacher_id" FROM "class_sessions"
ON CONFLICT ("session_id", "user_id") DO NOTHING;
