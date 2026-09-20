
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";

export { googleConfigured } from "./status";
import { googleConfigured } from "./status";

export const adapter = PrismaAdapter(prisma);

export const authConfig: NextAuthConfig = {
  adapter,
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        // Admin is a column on the user row, granted by another admin (see
        // src/app/admin/users/actions.ts) — never derived from the email
        // address, and never settable by the account itself. `user` here is
        // the row PrismaAdapter loaded for this session, so this costs no
        // extra query; AdapterUser just doesn't know about our column.
        session.user.isAdmin = (user as { isAdmin?: boolean }).isAdmin === true;
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
