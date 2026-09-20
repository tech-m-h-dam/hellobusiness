import { NextResponse } from "next/server";

/**
 * The only 500 body any route should ever return.
 *
 * An unhandled throw inside a route handler is rendered by the framework with
 * whatever the error carried — for a Prisma failure that is the failing query,
 * the model, and the database host. None of that is the caller's business and
 * all of it helps an attacker map the backend, so every handler catches its own
 * failures and answers with this fixed shape instead. The real error goes to
 * the server log, where it is actually useful.
 */
export function serverError(context: string, err: unknown) {
  console.error(`[api] ${context}`, err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
