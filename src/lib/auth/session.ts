import { auth } from "./config";
import { googleConfigured } from "./status";

/**
 * The session, for pages that work perfectly well without one.
 *
 * `auth()` reads the session row from the database on every request. The root
 * layout runs on every page, including the invoice generator, which needs no
 * account at all — so an unhandled failure there turns a momentary database
 * blip into the "Something went wrong" boundary across the entire site, for
 * people who were never signed in.
 *
 * Degrading to "signed out" is the honest outcome: the header loses its avatar
 * and the page keeps working. Pages that genuinely cannot function without the
 * database — /account, /admin — deliberately call `auth()` directly and are
 * allowed to fail loudly instead of pretending nobody is signed in.
 */
export async function optionalSession() {
  if (!googleConfigured) return null;
  try {
    return await auth();
  } catch (err) {
    console.error("[auth] session lookup failed — rendering as signed out", err);
    return null;
  }
}
