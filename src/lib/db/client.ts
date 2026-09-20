/**
 * The single PrismaClient instance for the whole app (server-only).
 *
 * Public pages must never import this — the routing rule is: static content
 * (blog, templates, guides) is generated/cached without a DB hit, and this
 * client is only ever reached from `/api/*`, admin server components, and
 * NextAuth. See lib/seo and the route-level `revalidate`/`fetchCache`
 * settings for how public pages stay off this path.
 *
 * Postgres via `@prisma/adapter-pg`. Nothing else in the app imports
 * PrismaClient directly, so the provider lives in exactly two places: the
 * `datasource` block in prisma/schema.prisma and the adapter below.
 */
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — the Postgres adapter has nothing to connect to.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Reuse the client across hot-reloads in dev so we don't exhaust the
// Postgres connection pool on every module reload.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
