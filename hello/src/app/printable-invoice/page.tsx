import Link from "next/link";
import type { Metadata } from "next";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import { googleConfigured } from "@/lib/auth/status";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

/**
 * Printing-focused page. Distinct intent from the PDF page: this visitor wants
 * paper — correct margins, no browser headers, nothing cut off at the edge.
 */
export const metadata: Metadata = buildMetadata({
  title: "Printable Invoice — Free Invoice to Fill In and Print",
  description:
    "Create a printable invoice free. Fill it in online, preview it at true page size, and print it directly — correct A4 or Letter margins, nothing cut off. No signup.",
  path: "/printable-invoice",
});

export default function PrintableInvoicePage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Printable Invoice", path: "/printable-invoice" },
          ]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Printable Invoice
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Fill in an invoice online and print it. The preview is the document at true page size, so
            what comes out of the printer matches what you see — with the editor controls, navigation
            and everything else stripped out of the printed page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <InvoiceEditor authAvailable={googleConfigured} />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="prose-doc">
          <h2>How to print your invoice</h2>
          <ol>
            <li>Fill in the invoice above — business, customer, items, and any tax or discount.</li>
            <li>Check the preview. It is rendered at true A4 or Letter size, not an approximation.</li>
            <li>
              Click <strong>Print</strong>. Your browser&rsquo;s print dialog opens with only the
              invoice on the page.
            </li>
            <li>
              In the dialog, set margins to <em>Default</em> or <em>None</em> and turn off
              &ldquo;Headers and footers&rdquo; so your browser does not add the page URL and date.
            </li>
          </ol>

          <h2>Getting the margins right</h2>
          <p>
            The invoice carries its own page margins, set in the Design tab. If you also let the
            browser add its default margins you get a double margin and a cramped document, so set the
            browser&rsquo;s margin to <em>None</em> and control the spacing from the Design tab
            instead. If content is being cut off at the edge, increase the page margin there rather
            than scaling the print output down.
          </p>

          <h2>Printing to PDF instead</h2>
          <p>
            Every major browser can &ldquo;print&rdquo; to a PDF file — choose <em>Save as PDF</em> as
            the destination in the print dialog. That is a perfectly good route, and it is also our
            fallback if PDF generation ever fails on your device. For a one-click download with a
            sensible file name, use the{" "}
            <Link href="/invoice-pdf-generator">invoice PDF generator</Link> instead.
          </p>

          <h2>Printing a blank invoice to fill in by hand</h2>
          <p>
            If you want a paper form to complete by hand, add your own business details, leave the
            customer and item fields empty, and print. Turning off the columns you do not need in the
            Design tab keeps the blank form uncluttered.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <FaqSection
            items={[
              {
                question: "Will the editor controls print with my invoice?",
                answer:
                  "No. The print stylesheet removes the editor, navigation, footer and any ads, so only the invoice document itself is printed.",
              },
              {
                question: "Why is my printed invoice cut off at the edge?",
                answer:
                  "Usually because the browser is adding its own margins on top of the invoice's. Set the browser's margin option to None in the print dialog, and control spacing with the page margin setting in the Design tab.",
              },
              {
                question: "How do I stop the URL and date printing on the page?",
                answer:
                  "Turn off 'Headers and footers' in your browser's print dialog — that text comes from the browser, not from the invoice.",
              },
              {
                question: "Can I print a blank invoice to fill in by hand?",
                answer:
                  "Yes. Fill in only your own business details, leave the rest empty and print. Hide any columns you do not need from the Design tab first.",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
