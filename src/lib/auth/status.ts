/**
 * Whether optional Google sign-in is configured.
 *
 * Deliberately a standalone module with no imports: pages need to know whether
 * to render sign-in affordances, and importing this from auth/config.ts would
 * pull NextAuth and the Prisma client into the server bundle of otherwise
 * static pages just to read an environment variable.
 */
export const googleConfigured = Boolean(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
);
