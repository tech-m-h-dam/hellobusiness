/**
 * Google One Tap sign-in.
 *
 * One Tap hands the browser a signed ID token directly (via Google Identity
 * Services), not an OAuth redirect/code — so it can't go through the
 * `/api/auth/[...nextauth]` catch-all, which only understands the
 * authorization-code flow for the "google" provider. Auth.js's Credentials
 * provider *could* carry the token instead, but it always mints a JWT session
 * (see @auth/core's callback handler), while this app's normal Google
 * sign-in uses database sessions via PrismaAdapter — mixing the two would
 * leave `auth()` unable to read a session created by One Tap.
 *
 * So this route verifies the token itself and then performs the same
 * find-or-create-user / link-account / create-session steps Auth.js's own
 * OAuth callback does, using the same adapter, so the resulting session is
 * indistinguishable from one created by the regular "Sign in with Google"
 * button.
 */
import { NextResponse } from "next/server";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { adapter, authConfig } from "@/lib/auth/config";
import { googleConfigured } from "@/lib/auth/status";
import { serverError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/client";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";

const SESSION_COOKIE_BASE_NAME = "authjs.session-token";
const DEFAULT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // Auth.js's own default

function isHttpsRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  if (!googleConfigured || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 404 });
  }

  const limited = rateLimit(clientKey(request, "google-one-tap"), { limit: 20, windowMs: 60_000 });
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
  const credential = (body as { credential?: unknown } | null)?.credential;
  if (typeof credential !== "string" || !credential) {
    return NextResponse.json({ error: "Missing credential" }, { status: 400 });
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let payload: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return NextResponse.json({ error: "Invalid Google credential" }, { status: 401 });
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return NextResponse.json({ error: "Invalid Google credential" }, { status: 401 });
  }

  // Every method below is implemented by PrismaAdapter; the `Adapter` type
  // just marks them optional because hand-written adapters may omit them.
  const { getUserByAccount, getUserByEmail, createUser, linkAccount, createSession } = adapter as Required<
    typeof adapter
  >;
  const providerAccountId = payload.sub;

  // Prefer an existing account link (the common case: this same Google
  // account has signed in here before, via One Tap or the redirect flow).
  // Falling back to matching by email links a pre-existing user with no
  // account row yet (e.g. one created before this route existed) instead of
  // creating a duplicate — safe here because Google is the only provider and
  // `email_verified` was already checked above.
  let user: Awaited<ReturnType<typeof getUserByAccount>>;
  let isNewUser = false;
  let session: Awaited<ReturnType<typeof createSession>>;
  try {
    user = await getUserByAccount({ providerAccountId, provider: "google" });
    if (!user) {
      const userByEmail = await getUserByEmail(payload.email);
      if (userByEmail) {
        user = userByEmail;
      } else {
        user = await createUser({
          // PrismaAdapter drops this and lets the database generate the real
          // id — see @auth/prisma-adapter's createUser, which destructures
          // `id` off before the insert. The type just requires one be present.
          id: crypto.randomUUID(),
          name: payload.name ?? null,
          email: payload.email,
          image: payload.picture ?? null,
          emailVerified: null,
        });
        isNewUser = true;
      }
      await linkAccount({
        userId: user.id,
        // Matches the `type` the Google provider's redirect flow stores
        // (Google is configured as an OIDC provider — see lib/auth/config.ts).
        type: "oidc",
        provider: "google",
        providerAccountId,
      });
    }

    const maxAge = authConfig.session?.maxAge ?? DEFAULT_MAX_AGE_SECONDS;
    session = await createSession({
      sessionToken: crypto.randomUUID(),
      userId: user.id,
      expires: new Date(Date.now() + maxAge * 1000),
    });
  } catch (err) {
    // A database failure here must not hand the caller the query that failed.
    return serverError("POST /api/auth/google-one-tap", err);
  }

  // Same best-effort lastLogin write as the redirect-flow's events.signIn.
  try {
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  } catch (err) {
    console.error("[auth] failed to record lastLogin (one tap)", err);
  }

  const useSecureCookies = isHttpsRequest(request);
  const response = NextResponse.json({ ok: true, isNewUser });
  response.cookies.set({
    name: `${useSecureCookies ? "__Secure-" : ""}${SESSION_COOKIE_BASE_NAME}`,
    value: session.sessionToken,
    expires: session.expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies,
  });
  return response;
}
