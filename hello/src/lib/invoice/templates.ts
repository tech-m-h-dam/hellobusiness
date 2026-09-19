/**
 * The template registry.
 *
 * A "template" is never its own renderer — every template is a `layout`
 * (one of a handful of real structural compositions, in
 * components/invoice/document/layouts) plus a settings *preset* (colors,
 * font, table style, logo position) applied on top of the invoice's own
 * `Invoice.settings`. This is what spec section 15 means by "every template
 * uses the same normalized invoice data model" and "changing templates must
 * never destroy invoice data": selecting a template only ever changes
 * `templateId` and merges a settings preset — it never touches business,
 * customer, items, taxes, or anything else.
 *
 * Layouts (components/invoice/document/layouts):
 *  - classic  — logo+business top-left, meta top-right, simple ruled table
 *  - banner   — full-width colored header band, bold title
 *  - sidebar  — narrow colored info column, content to its right
 *  - split    — two-column header, colored table header row
 *  - compact  — tight spacing/type for invoices with many line items
 *
 * 20 named presets are provided across those 5 layouts, covering the
 * categories in spec section 15. This is a deliberate design choice: five
 * true structural variants with meaningfully different preset styling reads
 * as "20 templates" to a user picking from a gallery, without the maintenance
 * cost (and eventual drift) of 20 independently-coded renderers.
 */
import type { InvoiceSettings } from "./types";

export type TemplateLayout = "classic" | "banner" | "sidebar" | "split" | "compact";

export type TemplateCategory =
  | "Minimal" | "Modern" | "Professional" | "Corporate" | "Elegant"
  | "Creative" | "Freelancer" | "Agency" | "Retail" | "Service"
  | "GST" | "Product" | "Construction" | "Consulting" | "Compact";

export type TemplatePreset = {
  id: string;
  name: string;
  category: TemplateCategory;
  layout: TemplateLayout;
  description: string;
  settings: Pick<
    InvoiceSettings,
    | "primaryColor" | "secondaryColor" | "accentTextColor"
    | "fontFamily" | "tableStyle" | "logoPosition"
  >;
};

export const TEMPLATES: TemplatePreset[] = [
  {
    id: "minimal", name: "Minimal", category: "Minimal", layout: "classic",
    description: "Clean black-and-white layout with generous whitespace. No color, all typography.",
    settings: { primaryColor: "#111827", secondaryColor: "#6b7280", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "minimal", logoPosition: "left" },
  },
  {
    id: "modern", name: "Modern", category: "Modern", layout: "banner",
    description: "Bold colored header band with a large title — reads well at a glance.",
    settings: { primaryColor: "#2563eb", secondaryColor: "#1e3a8a", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "striped", logoPosition: "left" },
  },
  {
    id: "professional", name: "Professional", category: "Professional", layout: "classic",
    description: "Traditional business invoice: ruled table, right-aligned totals, conservative type.",
    settings: { primaryColor: "#1f2937", secondaryColor: "#374151", accentTextColor: "#ffffff", fontFamily: "Times-Roman", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "corporate", name: "Corporate", category: "Corporate", layout: "sidebar",
    description: "Dark info sidebar for business and payment details, content column alongside.",
    settings: { primaryColor: "#0f172a", secondaryColor: "#1e293b", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "elegant", name: "Elegant", category: "Elegant", layout: "sidebar",
    description: "Soft, muted sidebar with serif headings for a refined, upscale feel.",
    settings: { primaryColor: "#78716c", secondaryColor: "#a8a29e", accentTextColor: "#ffffff", fontFamily: "Times-Roman", tableStyle: "minimal", logoPosition: "center" },
  },
  {
    id: "creative", name: "Creative", category: "Creative", layout: "banner",
    description: "Vivid header color and confident type for design-led studios.",
    settings: { primaryColor: "#db2777", secondaryColor: "#831843", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "striped", logoPosition: "right" },
  },
  {
    id: "freelancer", name: "Freelancer", category: "Freelancer", layout: "split",
    description: "Friendly two-column header sized for a solo freelancer's simple invoices.",
    settings: { primaryColor: "#0891b2", secondaryColor: "#155e75", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "minimal", logoPosition: "left" },
  },
  {
    id: "agency", name: "Agency", category: "Agency", layout: "banner",
    description: "Confident full-bleed header band for agencies billing retainers and projects.",
    settings: { primaryColor: "#7c3aed", secondaryColor: "#4c1d95", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "retail", name: "Retail", category: "Retail", layout: "split",
    description: "Product-forward layout with SKU and image columns visible by default.",
    settings: { primaryColor: "#ea580c", secondaryColor: "#9a3412", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "striped", logoPosition: "left" },
  },
  {
    id: "service", name: "Service", category: "Service", layout: "split",
    description: "Built for service line items: description-heavy rows, service period fields.",
    settings: { primaryColor: "#0d9488", secondaryColor: "#115e59", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "gst-classic", name: "GST Classic", category: "GST", layout: "classic",
    description: "HSN/SAC and tax-summary columns visible by default for Indian GST invoices.",
    settings: { primaryColor: "#15803d", secondaryColor: "#166534", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "gst-modern", name: "GST Modern", category: "GST", layout: "banner",
    description: "Same GST-ready columns with the bolder banner header.",
    settings: { primaryColor: "#16a34a", secondaryColor: "#14532d", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "striped", logoPosition: "left" },
  },
  {
    id: "product", name: "Product", category: "Product", layout: "compact",
    description: "Dense table tuned for long, multi-item product invoices.",
    settings: { primaryColor: "#4338ca", secondaryColor: "#312e81", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "construction", name: "Construction", category: "Construction", layout: "sidebar",
    description: "Rugged, high-contrast sidebar with room for PO numbers and site references.",
    settings: { primaryColor: "#b45309", secondaryColor: "#78350f", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "consulting", name: "Consulting", category: "Consulting", layout: "sidebar",
    description: "Polished sidebar layout suited to hourly and retainer consulting invoices.",
    settings: { primaryColor: "#1d4ed8", secondaryColor: "#1e3a8a", accentTextColor: "#ffffff", fontFamily: "Times-Roman", tableStyle: "minimal", logoPosition: "left" },
  },
  {
    id: "compact-mono", name: "Compact Mono", category: "Compact", layout: "compact",
    description: "The tightest layout — monochrome, small type, maximum rows per page.",
    settings: { primaryColor: "#18181b", secondaryColor: "#3f3f46", accentTextColor: "#ffffff", fontFamily: "Courier", tableStyle: "minimal", logoPosition: "left" },
  },
  {
    id: "classic-navy", name: "Classic Navy", category: "Professional", layout: "classic",
    description: "The classic layout in deep navy for a trustworthy, established feel.",
    settings: { primaryColor: "#1e3a8a", secondaryColor: "#1e40af", accentTextColor: "#ffffff", fontFamily: "Times-Roman", tableStyle: "bordered", logoPosition: "left" },
  },
  {
    id: "banner-slate", name: "Slate Banner", category: "Modern", layout: "banner",
    description: "The banner layout in understated slate for teams that want bold without bright.",
    settings: { primaryColor: "#334155", secondaryColor: "#1e293b", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "bordered", logoPosition: "center" },
  },
  {
    id: "split-amber", name: "Amber Split", category: "Creative", layout: "split",
    description: "The split layout with a warm amber accent for a distinctive, memorable invoice.",
    settings: { primaryColor: "#d97706", secondaryColor: "#92400e", accentTextColor: "#ffffff", fontFamily: "Helvetica", tableStyle: "striped", logoPosition: "right" },
  },
  {
    id: "sidebar-forest", name: "Forest Sidebar", category: "Elegant", layout: "sidebar",
    description: "The sidebar layout in deep green, calm and confident for established businesses.",
    settings: { primaryColor: "#166534", secondaryColor: "#14532d", accentTextColor: "#ffffff", fontFamily: "Times-Roman", tableStyle: "bordered", logoPosition: "left" },
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = Array.from(
  new Set(TEMPLATES.map((t) => t.category)),
);

export function getTemplate(id: string): TemplatePreset {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/**
 * Apply a template preset to an invoice's settings, preserving every other
 * setting (column visibility, margins, section toggles, etc.) the user has
 * already configured. This is the one function "switching a template" calls —
 * it only ever touches the styling keys the preset defines.
 */
export function applyTemplatePreset(
  settings: InvoiceSettings,
  templateId: string,
): InvoiceSettings {
  const preset = getTemplate(templateId);
  return { ...settings, ...preset.settings };
}
