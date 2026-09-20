/**
 * The invoice document renderer (HTML).
 *
 * Renders an actual page-sized sheet at real print dimensions so the on-screen
 * preview, the browser print output and the generated PDF all agree. The
 * template only decides which layout composes the shared parts and which
 * styling preset applies — the data is identical in every case.
 *
 * `data-print="area"` marks this subtree as the print target: globals.css
 * strips app chrome and lets this element flow across pages when printing.
 */
import { getTemplate } from "@/lib/invoice/templates";
import type { ComputedTotals, Invoice } from "@/lib/invoice/types";
import type { InlineEdit } from "@/lib/invoice/inline-edit";
import { webFontStack } from "./fonts";
import { LAYOUTS } from "./layouts";

/** Page dimensions in millimetres, matching the PDF page sizes. */
const PAGE_MM = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

export function InvoiceDocument({
  invoice,
  totals,
  /** Scale the sheet down to fit a preview column without changing its geometry. */
  scale = 1,
  className,
  edit,
}: {
  invoice: Invoice;
  totals: ComputedTotals;
  scale?: number;
  className?: string;
  /** Passed only by the live editor; absent everywhere else (see inline-edit.ts). */
  edit?: InlineEdit;
}) {
  const template = getTemplate(invoice.templateId);
  const Layout = LAYOUTS[template.layout] ?? LAYOUTS.classic;
  const { settings } = invoice;

  const page = PAGE_MM[settings.pageSize] ?? PAGE_MM.A4;
  const isLandscape = settings.orientation === "landscape";
  const widthMm = isLandscape ? page.height : page.width;
  const minHeightMm = isLandscape ? page.width : page.height;

  return (
    <div
      data-print="area"
      className={className}
      style={{
        // CSS custom properties consumed by the shared parts, so a template's
        // colours flow through without prop-drilling into every component.
        ["--doc-primary" as string]: settings.primaryColor,
        ["--doc-secondary" as string]: settings.secondaryColor,
        ["--doc-accent-text" as string]: settings.accentTextColor,
        ["--doc-margin" as string]: `${settings.margin}px`,

        width: `${widthMm}mm`,
        minHeight: `${minHeightMm}mm`,
        padding: `${settings.margin}px`,
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: webFontStack(settings.fontFamily),
        fontSize: settings.baseFontSize,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: "top left",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Layout invoice={invoice} totals={totals} edit={edit} />
    </div>
  );
}
