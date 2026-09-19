import { INVOICE_TYPES } from "@/lib/content/invoice-types";
import { GUIDES } from "@/lib/content/guides";
import { EXAMPLES } from "@/lib/content/examples";
import { TEMPLATES } from "@/lib/invoice/templates";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

/**
 * /llms.txt — a plain-text map of the site for language models and AI search
 * tools, in the emerging llms.txt convention.
 *
 * This is a best-effort courtesy for tools that choose to read it. It is not a
 * standard any crawler is obliged to honour, and publishing it does not
 * guarantee visibility in any AI product — we serve it because a clean,
 * machine-readable summary is cheap to produce and useful if read, not because
 * it confers ranking.
 *
 * Generated from the same registries that render the pages, so it cannot drift.
 */
export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## What this site is",
    "",
    "A free invoice generator. Invoices are created entirely in the browser:",
    "totals are calculated on the user's device, uploaded images are processed",
    "on the user's device, drafts are stored in the browser's IndexedDB, and the",
    "PDF is generated client-side. No account is required, and anonymous invoice",
    "data is never transmitted to the server. Signing in with Google is optional",
    "and only used to save invoices to an account on explicit user action.",
    "",
    "## Key facts",
    "",
    "- Cost: free, unlimited invoices, no watermark",
    "- Account required: no",
    "- Output: PDF (vector, selectable text), A4 or Letter, multi-page",
    "- Printing: supported, with a dedicated print stylesheet",
    `- Templates: ${TEMPLATES.length} presets across 5 structural layouts`,
    "- Taxes: user-defined; percentage or fixed; inclusive or exclusive; multiple per line",
    "- Discounts: line-level and invoice-level, applied before tax",
    "- Currencies: formatted via Intl, not a hardcoded table",
    "- Line-item images: supported, multiple per item, processed in-browser",
    "",
    "## Main tools",
    "",
    `- [Free Invoice Generator](${SITE_URL}/): the homepage is the tool`,
    `- [Invoice Generator](${SITE_URL}/invoice-generator): canonical tool page`,
    `- [Invoice PDF Generator](${SITE_URL}/invoice-pdf-generator): PDF output details`,
    `- [Printable Invoice](${SITE_URL}/printable-invoice): printing to paper`,
    "",
    "## Invoice generators by type",
    "",
    ...INVOICE_TYPES.map((t) => `- [${t.h1}](${SITE_URL}/${t.slug}): ${t.description}`),
    "",
    "## Invoice templates",
    "",
    `- [All templates](${SITE_URL}/invoice-templates)`,
    ...TEMPLATES.map((t) => `- [${t.name}](${SITE_URL}/invoice-templates/${t.id}): ${t.category} — ${t.description}`),
    "",
    "## Worked invoice examples",
    "",
    `- [All examples](${SITE_URL}/invoice-examples)`,
    ...EXAMPLES.map((e) => `- [${e.name}](${SITE_URL}/invoice-examples/${e.slug}): ${e.description}`),
    "",
    "## Guides",
    "",
    `- [All guides](${SITE_URL}/guides)`,
    ...GUIDES.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.answer}`),
    "",
    "## Other",
    "",
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    `- [Privacy Policy](${SITE_URL}/privacy)`,
    `- [Terms of Service](${SITE_URL}/terms)`,
    `- [Contact](${SITE_URL}/contact)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
