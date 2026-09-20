/**
 * Contact form endpoint. Rate limited and validated server-side; stores the
 * message for the admin inbox rather than emailing it, so there is no outbound
 * mail dependency to configure or leak credentials for.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message is too short").max(5000),
  /** Honeypot: bots fill hidden fields, humans never see this one. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "contact"), { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    );
  }

  const { name, email, subject, message, website } = parsed.data;
  if (website) {
    // Honeypot tripped — accept silently so the bot doesn't learn it was caught.
    return NextResponse.json({ ok: true });
  }

  await prisma.contactMessage.create({
    data: { name, email, subject: subject || null, message },
  });

  return NextResponse.json({ ok: true });
}
