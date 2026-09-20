/**
 * Optional authentication (Auth.js v5 / NextAuth beta).
 *
 * Authentication is genuinely optional here: the invoice generator is fully
 * functional with no session, and nothing in the anonymous path touches this
 * module. Signing in only unlocks saving invoices to an account so they follow
 * you to another device.
 *
 * If GOOGLE_CLIENT_ID/SECRET are not configured, the provider list is empty and
 * every sign-in surface hides itself rather than erroring — so the app runs in
 * development, and deploys, without OAuth credentials.
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";

export { googleConfigured } from "./status";
import { googleConfigured } from "./status";

/** Emails allowed into /admin, from ADMIN_EMAILS (comma-separated). */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Shared with the Google One Tap route (src/app/api/auth/google-one-tap),
 * which signs users in via a verified ID token rather than the redirect-based
 * OAuth flow and needs the same adapter to create the user/account/session
 * rows consistently with the normal sign-in path.
 */
export const adapter = PrismaAdapter(prisma);

export const authConfig: NextAuthConfig = {
  adapter,
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
          // Only what we need to identify the user — no Drive, no contacts.
          authorization: { params: { scope: "openid email profile" } },
        }),
      ]
    : [],
  session: { strategy: "database" },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = adminEmails().includes((user.email ?? "").toLowerCase());
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Record last login without blocking the sign-in if the write fails.
      try {
        if (user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        }
      } catch (err) {
        console.error("[auth] failed to record lastLogin", err);
      }
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
