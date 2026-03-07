// =============================================================================
// Prisma Client Singleton — Prevents connection pool exhaustion in dev
// =============================================================================

import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  // Determine SSL settings:
  // - Remote DB URLs (supabase, neon, etc.) need SSL with rejectUnauthorized: false
  // - Local connections (localhost, 127.0.0.1) skip SSL
  const isRemote = !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");

  const pool = new pg.Pool({
    connectionString,
    max: 1, // Serverless: one connection per function instance
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool, { schema: "public" });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
