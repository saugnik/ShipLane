import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

/**
 * Prisma 7 connects through a driver adapter rather than a URL in the schema.
 *
 * Pool sizing is deliberately small: on Vercel each serverless instance gets
 * its own pool, and Neon's free tier caps total connections. A handful of
 * instances with a large pool each will exhaust it long before the app is
 * actually under load.
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres database.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 3 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Next.js hot-reloads modules in dev; without the global cache we'd open a new
// pool on every reload and exhaust the database's connection limit.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
