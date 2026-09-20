import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { TEMPLATES } from "@/lib/invoice/templates";
import { INVOICE_TYPES } from "@/lib/content/invoice-types";
import { GUIDES } from "@/lib/content/guides";
import { EXAMPLES } from "@/lib/content/examples";

/**
 * XML sitemap.
 *
 * Only canonical, indexable URLs appear here. Deliberately excluded:
 * /admin, /account, /my-invoices and /api (private or user-specific), and the
 * duplicate-intent tool URLs that 301 to /invoice-generator — listing a URL
 * that redirects wastes crawl budget and muddies which page is canonical.
 *
 * Generated from the same content registries the pages render from, so a new
 * template, guide or invoice type appears in the sitemap automatically and
 * cannot silently drift out of sync.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/invoice-generator`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/invoice-pdf-generator`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/printable-invoice`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/invoice-templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/invoice-examples`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const tools: MetadataRoute.Sitemap = INVOICE_TYPES.map((type) => ({
    url: `${SITE_URL}/${type.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const templates: MetadataRoute.Sitemap = TEMPLATES.map((template) => ({
    url: `${SITE_URL}/invoice-templates/${template.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guides: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt ?? guide.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const examples: MetadataRoute.Sitemap = EXAMPLES.map((example) => ({
    url: `${SITE_URL}/invoice-examples/${example.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...core, ...tools, ...templates, ...guides, ...examples];
}
