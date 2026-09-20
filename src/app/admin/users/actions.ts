"use server";

/**
 * Admin role changes.
 *
 * Admin is a column on the user row, not a list of emails in the environment:
 * it is granted and revoked here, by someone who is already an admin, and the
 * session picks it up from the row (see src/lib/auth/config.ts). Nothing a
 * user controls about their own account — their email, their Google profile —
 * can make them an admin.
 *
 * Every rule below is enforced server-side, because the form this runs from is
 * only as trustworthy as the person posting to it:
 *  - the caller must already be an admin (re-checked here, not inherited from
 *    the layout that rendered the page);
 *  - an admin cannot change their own flag, which both removes the obvious
 *    self-lockout and means promotion always involves a second person;
 *  - the last remaining admin cannot be demoted, or the section becomes
 *    unreachable for everyone.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Not authorized");
  return session.user;
}

const schema = z.object({
  userId: z.string().min(1),
  makeAdmin: z.enum(["true", "false"]),
});

export async function setUserAdmin(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    makeAdmin: formData.get("makeAdmin"),
  });
  if (!parsed.success) throw new Error("Invalid request");

  const { userId } = parsed.data;
  const makeAdmin = parsed.data.makeAdmin === "true";

  if (userId === admin.id) {
    throw new Error("You cannot change your own admin access.");
  }

  if (!makeAdmin) {
    const remaining = await prisma.user.count({
      where: { isAdmin: true, id: { not: userId } },
    });
    if (remaining === 0) {
      throw new Error("There must be at least one admin.");
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { isAdmin: makeAdmin } });
  revalidatePath("/admin/users");
}
