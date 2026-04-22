import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as users from "./schema/users";
import * as courses from "./schema/courses";
import * as learning from "./schema/learning";
import * as quizzes from "./schema/quizzes";
import * as social from "./schema/social";

import * as platform from "./schema/platform";
import * as attendance from "./schema/attendance";
import * as schedules from "./schema/schedules";
import * as announcements from "./schema/announcements";

// Optimized connection pool
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: env.DATABASE_URL.includes("supabase.co") ? "require" : undefined,
  onnotice: () => {},
});

export const db = drizzle(client, {
  schema: { ...users, ...courses, ...learning, ...quizzes, ...social, ...platform, ...attendance, ...schedules, ...announcements },
});

export type DB = typeof db;
