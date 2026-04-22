import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
    ssl: "require",
  },
});
