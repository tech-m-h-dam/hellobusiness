/**
 * The single PrismaClient instance for the whole app (server-only).
 *
 * Public pages must never import this — the routing rule is: static content
 * (blog, templates, guides) is generated/cached without a DB hit, and this
 * client is only ever reached from `/api/*`, admin server components, and
 * NextAuth. See lib/seo and the route-level `revalidate`/`fetchCache`
 * settings for how public pages stay off this path.
 *
 * Provider swap: change `provider` in prisma/schema.prisma to "postgresql"
 * and replace the adapter below with `@prisma/adapter-pg` — nothing else in
 * the app imports PrismaClient directly, so no other file changes.
 */
import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

// Reuse the client across hot-reloads in dev so we don't exhaust SQLite file
// handles / Postgres connections on every module reload.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
