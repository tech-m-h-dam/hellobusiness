import "dotenv/config";
import { defineConfig } from "prisma/config";

// Used by the Prisma CLI (generate / migrate / studio) only. The running
// application never reads this file — it builds its own adapter in
// src/lib/db/client.ts so the runtime connection is explicit and swappable.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
