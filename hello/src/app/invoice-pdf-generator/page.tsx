import Link from "next/link";
import type { Metadata } from "next";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import { googleConfigured } from "@/lib/auth/status";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

/**
 * A separate page from /invoice-generator because the intent is genuinely
 * different: someone searching "invoice PDF generator" is asking about the
 * output file — quality, page size, multi-page behaviour, fonts — not about
 * invoicing in general. The content below answers that, rather than repeating
 * the generator page with a keyword swapped (spec sections 60, 73).
 */
export const metadata: Metadata = buildMetadata({
  title: "Invoice PDF Generator — Create & Download Invoice PDFs Free",
  description:
    "Generate an invoice PDF in your browser. Real vector PDF with selectable text, A4 or Letter, multi-page support, page numbers and embedded images. Free, no signup.",
  path: "/invoice-pdf-generator",
});

export default function InvoicePdfGeneratorPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Invoice PDF Generator", path: "/invoice-pdf-generator" },
          ]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Invoice PDF Generator
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Create an invoice and download it as a PDF. The file is generated in your browser — real
            vector PDF with selectable, searchable text rather than a flattened image, in A4 or
            Letter, with long invoices flowing across pages without splitting rows. Free, no signup.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <InvoiceEditor authAvailable={googleConfigured} />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="prose-doc">
          <h2>What kind of PDF this produces</h2>
          <p>
            The PDF is built from the invoice data directly, not by taking a picture of the screen.
            That distinction matters more than it sounds:
          </p>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>This generator</th>
                <th>Screenshot-based tools</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Text</td>
                <td>Selectable, searchable, copyable</td>
                <td>Flattened into pixels</td>
              </tr>
              <tr>
                <td>Sharpness</td>
                <td>Vector — sharp at any zoom or print size</td>
                <td>Blurs when zoomed or printed</td>
              </tr>
              <tr>
                <td>File size</td>
                <td>Typically tens of KB</td>
                <td>Often several MB</td>
              </tr>
              <tr>
                <td>Page breaks</td>
                <td>Rows and images never split</td>
                <td>Sliced mid-row at the page edge</td>
              </tr>
            </tbody>
          </table>

          <h2>Page size, orientation and multi-page invoices</h2>
          <p>
            Choose A4 or Letter and portrait or landscape in the Design tab. When an invoice runs
            longer than a page, the table header repeats at the top of each new page, the totals block
            stays together rather than being split, and a page number line can be printed at the
            bottom of every page. Line items and their images are kept whole — a row either fits on
            the page or moves to the next one.
          </p>

          <h2>Images and logos in the PDF</h2>
          <p>
            Your logo, any line-item images and your signature are embedded in the PDF itself. They
            are resized and compressed in your browser first, which keeps the file small: a photo
            straight from a phone camera would otherwise add several megabytes per image.
          </p>

          <h2>The file name</h2>
          <p>
            Downloads are named after your invoice number — <code>invoice-INV-1001.pdf</code> — so a
            folder of them sorts and searches sensibly rather than filling up with{" "}
            <code>document(3).pdf</code>.
          </p>

          <h2>Nothing is uploaded</h2>
          <p>
            The PDF is assembled on your device and handed straight to your browser&rsquo;s download.
            Your invoice is never transmitted to us to be rendered, which is why it works with your
            connection off and why we can state plainly that we do not hold your invoice data. If you
            would rather use your browser&rsquo;s own PDF writer, the{" "}
            <Link href="/printable-invoice">printable invoice page</Link> covers that route.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <FaqSection
            items={[
              {
                question: "Is the invoice PDF free to download?",
                answer:
                  "Yes — unlimited PDF downloads, free, with no watermark and no account required.",
              },
              {
                question: "Can the PDF be more than one page?",
                answer:
                  "Yes. Long invoices flow across as many pages as needed. The table header repeats on each page, rows are never split across a page break, and page numbers can be shown.",
              },
              {
                question: "Is the text in the PDF selectable?",
                answer:
                  "Yes. The PDF contains real text, so it can be selected, copied, searched and read by screen readers — it is not an image of an invoice.",
              },
              {
                question: "What page sizes are supported?",
                answer: "A4 and Letter, in portrait or landscape. Set it in the Design tab.",
              },
              {
                question: "Is my invoice uploaded to generate the PDF?",
                answer:
                  "No. The PDF is generated in your browser. The invoice data never reaches our servers.",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
