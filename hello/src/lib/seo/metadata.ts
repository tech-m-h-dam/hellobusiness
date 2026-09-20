/**
 * Reusable metadata + JSON-LD builders.
 *
 * Spec section 28: every indexable page must have unique title/description/
 * canonical/OG data, produced by one utility rather than hand-rolled per page
 * so we can never accidentally ship identical metadata across many pages.
 */
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

export type PageMetadataInput = {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/invoice-templates/modern". */
  path: string;
  /** Absolute or site-relative OG image URL. Defaults to the site-wide OG image. */
  image?: string;
  type?: "website" | "article";
  /** Set true for pages that must never be indexed (admin, account, search results). */
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * No default image constant on purpose.
 *
 * `app/opengraph-image.tsx` generates the site-wide OG image, and Next.js
 * injects it automatically into any page that does not declare its own. If we
 * set a default path here it would *override* that generated image on every
 * page — which is how you end up shipping a site-wide og:image 404.
 */

/**
 * Build a Next.js `Metadata` object for one page. Titles are suffixed with the
 * site name except the homepage, which sets its own full `<title>`.
 */
export function generateMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      // Omitted when no page-specific image is given, so Next's generated
      // app/opengraph-image.tsx is used instead of being overridden.
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
      type,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/** Whether a route should be indexable — used by generateMetadata callers and the sitemap. */
export function isIndexablePath(path: string): boolean {
  const blocked = ["/admin", "/api/", "/my-invoices", "/account", "/auth"];
  return !blocked.some((prefix) => path.startsWith(prefix));
}

export type Breadcrumb = { name: string; path: string };

/** JSON-LD BreadcrumbList for a page's trail. */
export function breadcrumbSchema(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** JSON-LD Organization, included once in the root layout. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
  };
}

/** JSON-LD WebSite, included once in the root layout. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/** JSON-LD SoftwareApplication for the invoice generator tool itself. */
export function softwareApplicationSchema(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (runs in the browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

/** JSON-LD FAQPage from a simple Q&A list. */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** JSON-LD Article/BlogPosting for a blog post or guide. */
export function articleSchema(input: {
  headline: string;
  description: string;
  path: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.image ? absoluteUrl(input.image) : undefined,
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime ?? input.publishedTime,
    author: { "@type": "Organization", name: input.authorName ?? SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

/** Render a JSON-LD object as a <script> tag's children. Safe against `</script>` injection. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
