/**
 * Saved invoices — the only endpoint that ever receives invoice content, and
 * only when an authenticated user explicitly chooses "Save to my account".
 *
 * Anonymous invoice creation never calls this. There is deliberately no API for
 * calculating totals, rendering previews or generating PDFs: all of that runs
 * in the browser (spec sections 41, 64).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { invoiceSchema } from "@/lib/invoice/validation";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";

export const dynamic = "force-dynamic";

/** List the signed-in user's saved invoices (metadata only — not the payloads). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const invoices = await prisma.savedInvoice.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    // Deliberately omit dataJson: the list view doesn't need invoice contents,
    // and not sending them keeps the response small and the exposure minimal.
    select: {
      id: true,
      invoiceNumber: true,
      title: true,
      templateId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ invoices });
}

/** Create or update a saved invoice. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limited = rateLimit(clientKey(request, "invoices"), { limit: 60, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Re-validate server-side with the same schema the client uses. Client-side
  // validation is a UX affordance; this is the actual trust boundary.
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invoice", issues: parsed.error.issues.slice(0, 10) },
      { status: 400 },
    );
  }

  const invoice = parsed.data;
  const title = invoice.customer.name || invoice.invoice.number;

  const saved = await prisma.savedInvoice.upsert({
    // Scoping by id alone would let one user overwrite another's row, so the
    // ownership check is part of the write, not a separate read.
    where: { id: invoice.id },
    update: {
      invoiceNumber: invoice.invoice.number,
      title,
      templateId: invoice.templateId,
      dataJson: JSON.stringify(invoice),
    },
    create: {
      id: invoice.id,
      userId: session.user.id,
      invoiceNumber: invoice.invoice.number,
      title,
      templateId: invoice.templateId,
      dataJson: JSON.stringify(invoice),
    },
  });

  return NextResponse.json({ id: saved.id, updatedAt: saved.updatedAt });
}

/** Delete a saved invoice the signed-in user owns. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // deleteMany with the userId in the filter makes ownership part of the query,
  // so a guessed id from another account simply deletes nothing.
  const result = await prisma.savedInvoice.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
