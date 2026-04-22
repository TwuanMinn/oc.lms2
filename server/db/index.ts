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

// In dev, Next.js HMR re-evaluates modules and leaks a new postgres client each time,
// eventually exhausting Supabase's per-project connection limit. Cache on globalThis so
// the same client survives HMR. Production runs a single process so a plain const is fine.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: env.DATABASE_URL.includes("supabase.co") ? "require" : undefined,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, {
  schema: { ...users, ...courses, ...learning, ...quizzes, ...social, ...platform, ...attendance, ...schedules, ...announcements },
});

export type DB = typeof db;
