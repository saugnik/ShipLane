import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Migrations connect through `DIRECT_URL` when it is set.
 *
 * A pooled Neon endpoint runs PgBouncer in transaction mode, which cannot hold
 * the session-level advisory lock Prisma Migrate uses to stop two deploys
 * migrating concurrently — so migrating through the pooler times out with
 * P1002. The app itself still uses the pooled `DATABASE_URL` at runtime, where
 * pooling is exactly what serverless needs.
 */
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "Neither DIRECT_URL nor DATABASE_URL is set. Copy .env.example to .env and add your Postgres connection string.",
  );
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
