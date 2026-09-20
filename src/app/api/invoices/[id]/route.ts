/**
 * Fetch one saved invoice's full payload.
 *
 * Split from the list endpoint so listing never ships invoice contents (and
 * their embedded images); the payload is only sent when someone opens a
 * specific invoice they own.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { serverError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Ownership is part of the query, so another account's id simply finds nothing.
  let saved: { dataJson: string } | null;
  try {
    saved = await prisma.savedInvoice.findFirst({
      where: { id, userId: session.user.id },
      select: { dataJson: true },
    });
  } catch (err) {
    return serverError("GET /api/invoices/[id]", err);
  }

  if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    return NextResponse.json({ invoice: JSON.parse(saved.dataJson) });
  } catch {
    // A row that cannot be parsed is corrupt, not missing — say so distinctly.
    return NextResponse.json({ error: "Saved invoice is unreadable" }, { status: 422 });
  }
}
