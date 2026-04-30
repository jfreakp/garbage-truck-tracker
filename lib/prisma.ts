import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

// Prisma 7 uses a driver adapter instead of a built-in query engine.
// We use the pg driver adapter which reads DATABASE_URL at runtime.
function createPrismaClient() {
  const pool = new Pool({
    // DATABASE_URL  = transaction pooler (recommended for Vercel serverless)
    // DIRECT_URL    = direct connection (fallback / local dev)
    connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL,
    max: 1, // Serverless: one connection per function instance avoids exhausting Supabase's pool
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
