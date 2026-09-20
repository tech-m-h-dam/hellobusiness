/**
 * Grant (or revoke) admin access from the command line.
 *
 * Admin is a database column granted by an existing admin, which leaves one
 * gap: the *first* admin, on a fresh database, has nobody to grant it. This
 * script is that bootstrap, and it is deliberately not reachable from the web
 * — running it requires shell access to the deployment and the database URL.
 *
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:grant -- someone@example.com --revoke
 *
 * The person must have signed in at least once, so there is a user row to
 * promote.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  const revoke = args.includes("--revoke");

  if (!email) {
    console.error("Usage: npm run admin:grant -- <email> [--revoke]");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      console.error(`No user with email ${email}. They need to sign in once first.`);
      process.exit(1);
    }

    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: !revoke } });
    console.log(`${revoke ? "Revoked admin from" : "Granted admin to"} ${email}.`);

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { email: true },
      orderBy: { email: "asc" },
    });
    console.log(`Admins now: ${admins.map((a) => a.email).join(", ") || "(none)"}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
