import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * robots.txt.
 *
 * Private and user-specific areas are disallowed; everything public — including
 * CSS, JavaScript and images, which Google needs to render and judge the page —
 * stays crawlable. /_next/static is explicitly allowed so that blocking it can
 * never happen by accident through a broader rule.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/_next/static/"],
        disallow: ["/admin", "/api/", "/my-invoices", "/account", "/auth"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
