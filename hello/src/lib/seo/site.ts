/**
 * Site-wide constants. Every canonical URL, sitemap entry, OG tag and JSON-LD
 * block derives from `SITE_URL` here — nothing in the app hardcodes a domain
 * (spec section 72), so promoting from a preview domain to production is one
 * environment variable.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export const SITE_NAME = "InvoiceFree";

export const SITE_TAGLINE = "Free Invoice Generator";

export const SITE_DESCRIPTION =
  "Create professional invoices online for free. Customize your invoice, add your logo and item images, and download a PDF instantly — no signup required.";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SOCIAL = {
  twitter: "",
};
