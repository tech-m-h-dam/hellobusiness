/**
 * Homepage — a Server Component.
 *
 * The hero, SEO copy, template gallery, guide links and FAQ are all rendered
 * on the server and ship as static HTML. Only <InvoiceEditor> is a Client
 * Component, so the marketing surface costs almost no JavaScript while the
 * tool itself is immediately usable on the same page (spec sections 5, 6, 67).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { Check, FileDown, Images, Lock, Palette, Zap } from "lucide-react";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import { googleConfigured } from "@/lib/auth/status";
import { FaqSection, type Faq } from "@/components/seo/FaqSection";
import { AdSlot } from "@/components/ads/AdSlot";
import { TEMPLATES } from "@/lib/invoice/templates";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo/site";
import { jsonLd, softwareApplicationSchema } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: `Free Invoice Generator — Create & Download Invoices | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: "Free Invoice Generator",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    type: "website",
  },
};

const TRUST_POINTS = [
  { icon: Zap, label: "Free forever", detail: "No trial, no credit card." },
  { icon: Lock, label: "No signup required", detail: "Start typing straight away." },
  { icon: FileDown, label: "PDF download", detail: "One click, no watermark." },
  { icon: Palette, label: "Fully customizable", detail: "Colors, fonts, columns, layout." },
  { icon: Images, label: "Item images", detail: "Add photos to any line item." },
  { icon: Check, label: "Privacy-friendly", detail: "Created in your browser." },
];

const FAQS: Faq[] = [
  {
    question: "Is this invoice generator really free?",
    answer:
      "Yes. You can create, customize, print and download unlimited invoices as PDFs at no cost, and there is no watermark on the output. There is no trial period and no credit card is required.",
  },
  {
    question: "Do I need to sign up to create an invoice?",
    answer:
      "No. The generator works immediately without an account. Signing in with Google is optional, and only useful if you want to save invoices to your account so you can open them from another device.",
  },
  {
    question: "Can I download my invoice as a PDF?",
    answer:
      "Yes. Click Download PDF and the file is generated in your browser and saved to your device as invoice-INV-1001.pdf (using your own invoice number). You can also use Print to save it through your browser's own PDF writer.",
  },
  {
    question: "Can I add my logo to the invoice?",
    answer:
      "Yes. Upload a JPG, PNG or WebP logo in the business section. It is resized and compressed in your browser, then placed on the invoice at a size and position you control.",
  },
  {
    question: "Can I add images to invoice line items?",
    answer:
      "Yes. Each line item can carry one or many images — useful for product invoices, repair work, photography and construction jobs. You can choose a thumbnail, large image, gallery or product-card layout, and set the size, alignment and corner radius.",
  },
  {
    question: "Is my invoice data uploaded to your servers?",
    answer:
      "No. Invoices you create anonymously stay in your browser: the data is held in your browser's local storage, totals are calculated on your device, and the PDF is generated there too. Nothing is sent to us unless you explicitly sign in and choose Save to my account.",
  },
  {
    question: "Can I add GST, VAT or sales tax?",
    answer:
      "Yes. You can define any number of taxes with your own names and rates, choose percentage or fixed amounts, and mark each as inclusive or exclusive of the item price. Presets are available for common setups such as GST 18%, a CGST/SGST split, IGST and VAT.",
  },
  {
    question: "Can I print the invoice?",
    answer:
      "Yes. The Print button opens your browser's print dialog with the editor controls, navigation and ads removed, so what prints is exactly the invoice document you see in the preview.",
  },
];

export default function HomePage() {
  const featuredTemplates = TEMPLATES.slice(0, 8);

  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              Free Invoice Generator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
              Create professional invoices online for free. Customize your invoice, add your logo
              and item images, and download a PDF instantly — no signup required.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#invoice-generator"
                className="inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-base font-medium text-white transition-colors hover:bg-brand-700"
              >
                Create Free Invoice
              </a>
              <Link
                href="/invoice-templates"
                className="inline-flex h-12 items-center rounded-lg border border-ink-300 bg-white px-6 text-base font-medium text-ink-800 transition-colors hover:bg-ink-50"
              >
                Explore Invoice Templates
              </Link>
            </div>
          </div>

          <ul className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TRUST_POINTS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="rounded-lg border border-ink-200 bg-white p-3 text-center">
                <Icon className="mx-auto size-5 text-brand-600" aria-hidden="true" />
                <p className="mt-2 text-[13px] font-medium text-ink-900">{label}</p>
                <p className="text-[11.5px] text-ink-500">{detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The tool --------------------------------------------------------- */}
      <section id="invoice-generator" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10">
        <InvoiceEditor authAvailable={googleConfigured} />
      </section>

      <div className="mx-auto max-w-5xl px-4">
        <AdSlot slot="home-below-tool" />
      </div>

      {/* SEO content ------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="prose-doc">
          <h2>How to create an invoice with this free invoice generator</h2>
          <p>
            Fill in your business details, add your customer, list what you are billing for, and
            download the PDF. The whole process takes about two minutes, and nothing is locked
            behind an account.
          </p>
          <ol>
            <li>
              <strong>Add your business details.</strong> Business name, address, email and phone.
              Upload your logo — it is resized in your browser, so a large file will not slow the
              page down or bloat the PDF.
            </li>
            <li>
              <strong>Add your customer.</strong> Name, company, billing address, and a separate
              shipping address if the goods go somewhere else. Tax numbers such as GSTIN or a VAT
              number can be shown for both parties.
            </li>
            <li>
              <strong>List your items or services.</strong> Give each line a description, quantity,
              unit and rate. Add a per-line discount, attach images, and apply whichever taxes you
              defined.
            </li>
            <li>
              <strong>Set taxes, discounts and charges.</strong> Define GST, VAT, sales tax or your
              own custom tax, as a percentage or a fixed amount, inclusive or exclusive of the price.
              Add an invoice-level discount and charges such as shipping.
            </li>
            <li>
              <strong>Pick a template and customize it.</strong> Choose from{" "}
              {TEMPLATES.length} templates and adjust colors, fonts, margins, table style and which
              columns appear. Switching templates never changes the data you have entered.
            </li>
            <li>
              <strong>Preview and download.</strong> The preview on the right is the actual document
              at real page size. Click <strong>Download PDF</strong> to save it, or{" "}
              <strong>Print</strong> to send it to a printer or your browser&rsquo;s PDF writer.
            </li>
          </ol>

          <h2>What should an invoice include?</h2>
          <p>
            A professional invoice should carry enough information for your customer to identify the
            charge, verify it and pay it — and for you to reference it later if payment is late.
            At minimum, include:
          </p>
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>The word &ldquo;Invoice&rdquo;</td>
                <td>Distinguishes it from a quote, estimate or receipt.</td>
              </tr>
              <tr>
                <td>Invoice number</td>
                <td>A unique reference for your records, your customer&rsquo;s and your accountant&rsquo;s.</td>
              </tr>
              <tr>
                <td>Invoice date and due date</td>
                <td>Starts the payment clock and makes late payment unambiguous.</td>
              </tr>
              <tr>
                <td>Your details and your customer&rsquo;s</td>
                <td>Names, addresses and contact details for both parties.</td>
              </tr>
              <tr>
                <td>Itemised list of goods or services</td>
                <td>Description, quantity, rate and line total, so the charge can be checked.</td>
              </tr>
              <tr>
                <td>Tax breakdown</td>
                <td>Required in most jurisdictions where tax is charged; shows the rate and amount.</td>
              </tr>
              <tr>
                <td>Total amount due</td>
                <td>The single number your customer needs to pay.</td>
              </tr>
              <tr>
                <td>Payment details and terms</td>
                <td>How to pay, and by when. Removes the most common excuse for delay.</td>
              </tr>
            </tbody>
          </table>
          <p>
            For a fuller walkthrough, see our guide on{" "}
            <Link href="/guides/what-should-an-invoice-include">what an invoice should include</Link>{" "}
            or read{" "}
            <Link href="/guides/how-to-create-an-invoice">how to create an invoice step by step</Link>.
          </p>

          <h2>Your invoice data stays in your browser</h2>
          <p>
            When you use this generator without signing in, your invoice never leaves your device.
            The totals are calculated on your device, the images you upload are resized on your
            device, the draft is stored in your browser&rsquo;s own storage, and the PDF is built in
            your browser. There is no server-side invoice processing to opt out of, because there
            isn&rsquo;t any.
          </p>
          <p>
            If you choose to sign in with Google and click <em>Save to my account</em>, only then is
            that invoice sent to us and stored against your account, so you can open it from another
            device. That is an explicit action, never automatic.
          </p>
        </div>
      </section>

      {/* Templates -------------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink-900">Invoice templates</h2>
              <p className="mt-2 max-w-2xl text-ink-600">
                {TEMPLATES.length} professional templates across minimal, modern, corporate,
                freelance, GST and product styles. Pick one now or switch any time — your data stays
                exactly as you entered it.
              </p>
            </div>
            <Link href="/invoice-templates" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all templates →
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredTemplates.map((template) => (
              <li key={template.id}>
                <Link
                  href={`/invoice-templates/${template.id}`}
                  className="block rounded-xl border border-ink-200 bg-white p-3 transition-shadow hover:shadow-md"
                >
                  <span
                    className="mb-3 flex h-24 w-full flex-col justify-between overflow-hidden rounded-lg border border-ink-100"
                    aria-hidden="true"
                  >
                    <span className="block h-6 w-full" style={{ backgroundColor: template.settings.primaryColor }} />
                    <span className="flex flex-1 flex-col gap-1 px-2 py-2">
                      <span className="block h-1 w-2/3 rounded bg-ink-200" />
                      <span className="block h-1 w-full rounded bg-ink-100" />
                      <span className="block h-1 w-full rounded bg-ink-100" />
                      <span className="mt-auto block h-2 w-1/3 self-end rounded" style={{ backgroundColor: template.settings.primaryColor }} />
                    </span>
                  </span>
                  <p className="text-sm font-medium text-ink-900">{template.name}</p>
                  <p className="text-[12px] text-ink-500">{template.category}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Invoice types ---------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink-900">Invoice generators by type</h2>
        <p className="mt-2 max-w-2xl text-ink-600">
          Each of these opens the same editor with the right fields, columns and template already
          set up for that kind of work.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { href: "/gst-invoice-generator", label: "GST Invoice" },
            { href: "/tax-invoice-generator", label: "Tax Invoice" },
            { href: "/service-invoice-generator", label: "Service Invoice" },
            { href: "/sales-invoice-generator", label: "Sales Invoice" },
            { href: "/freelance-invoice-generator", label: "Freelancer Invoice" },
            { href: "/consultant-invoice-generator", label: "Consultant Invoice" },
            { href: "/contractor-invoice-generator", label: "Contractor Invoice" },
            { href: "/developer-invoice-generator", label: "Developer Invoice" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ -------------------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <FaqSection items={FAQS} />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            softwareApplicationSchema({
              name: "Free Invoice Generator",
              description: SITE_DESCRIPTION,
              path: "/",
            }),
          ),
        }}
      />
    </>
  );
}
