import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL = Supabase direct connection (port 5432) — required for migrations.
// Falls back to DATABASE_URL if DIRECT_URL is not set (e.g. local dev with a
// single connection string pointing straight to the database).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
