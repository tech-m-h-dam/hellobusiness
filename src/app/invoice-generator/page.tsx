/**
 * The canonical invoice tool page.
 *
 * Distinct from the homepage in framing: the homepage introduces the product
 * to someone arriving cold, this page assumes the visitor searched for an
 * invoice generator and wants the tool immediately, with reference material
 * below it rather than a pitch above it. Duplicate-intent URLs
 * (/invoice-creator, /invoice-maker, /online-invoice-generator, …) redirect
 * here rather than existing as near-identical indexable pages — see the
 * redirects in next.config.ts and spec section 73.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import { googleConfigured } from "@/lib/auth/status";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { AdSlot } from "@/components/ads/AdSlot";
import { INVOICE_TYPES } from "@/lib/content/invoice-types";
import { TEMPLATES } from "@/lib/invoice/templates";
import { generateMetadata as buildMetadata, jsonLd, softwareApplicationSchema } from "@/lib/seo/metadata";

const DESCRIPTION =
  "Free online invoice generator. Add your business, customer and items, apply tax and discounts, customize the template and download a PDF — in your browser, with no signup.";

export const metadata: Metadata = buildMetadata({
  title: "Invoice Generator — Create an Invoice Online Free",
  description: DESCRIPTION,
  path: "/invoice-generator",
});

export default function InvoiceGeneratorPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Invoice Generator", path: "/invoice-generator" },
          ]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Invoice Generator
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Create an invoice online and download it as a PDF. Enter your business and customer
            details, add what you are billing for, apply tax and discounts if you need them, and pick
            a template. It runs entirely in your browser — there is no account to create and your
            invoice is not uploaded anywhere.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <InvoiceEditor authAvailable={googleConfigured} />
      </section>

      <div className="mx-auto max-w-5xl px-4">
        <AdSlot slot="generator-below-tool" />
      </div>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="prose-doc">
          <h2>How the invoice generator works</h2>
          <p>
            Everything happens on your device. When you type a quantity, the totals are recalculated
            in your browser; when you upload a logo or a product photo, it is resized and compressed
            in your browser; when you click Download PDF, the PDF is assembled in your browser and
            saved straight to your downloads folder. No invoice data is transmitted to us at any
            point in that flow.
          </p>
          <p>
            Your work in progress is kept in your browser&rsquo;s own storage, so closing the tab and
            coming back later picks up where you left off. Clearing your browser data clears your
            invoices too — if you want them to survive that, sign in with Google and use{" "}
            <em>Save to my account</em>, which is the only path that sends an invoice to our servers,
            and only when you click it.
          </p>

          <h2>Taxes, discounts and charges</h2>
          <p>
            Define any tax you need by name and rate — GST, VAT, sales tax or something specific to
            your jurisdiction — as a percentage or a fixed amount, and mark it inclusive or exclusive
            of your prices. Apply different taxes to different line items, add a discount per line or
            across the whole invoice, and add charges such as shipping with or without tax applied.
          </p>
          <p>
            Two details worth knowing, because they are where invoice tools commonly go wrong.
            Discounts are applied to the taxable base <em>before</em> tax is calculated, which is what
            tax authorities require — calculating tax first would overstate what is owed. And every
            amount you see is rounded before it is added into a total, so the rows on the printed
            invoice always add up to the printed total rather than being a cent out.
          </p>

          <h2>Invoice generators for specific work</h2>
          <p>
            These open the same editor with the right columns, fields and template already configured:
          </p>
          <ul>
            {INVOICE_TYPES.map((type) => (
              <li key={type.slug}>
                <Link href={`/${type.slug}`}>{type.h1}</Link>
              </li>
            ))}
          </ul>

          <h2>Templates</h2>
          <p>
            There are {TEMPLATES.length} templates across five structural layouts. Switching between
            them never affects the data you have entered, so you can compare them freely. Browse{" "}
            <Link href="/invoice-templates">all invoice templates</Link>, or start with{" "}
            <Link href="/invoice-templates/minimal">Minimal</Link>,{" "}
            <Link href="/invoice-templates/modern">Modern</Link> or{" "}
            <Link href="/invoice-templates/corporate">Corporate</Link>.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <FaqSection
            items={[
              {
                question: "How do I create an invoice online for free?",
                answer:
                  "Fill in your business details and your customer's, add a line for each item or service with its quantity and rate, apply any tax or discount, pick a template, then click Download PDF. No account is needed at any step.",
              },
              {
                question: "Do I need to install anything?",
                answer:
                  "No. It runs in your browser. After the page has loaded once, the editor keeps working even if your connection drops — editing, calculating, previewing and PDF generation all happen locally.",
              },
              {
                question: "Is there a limit on how many invoices I can create?",
                answer: "No. Create and download as many as you like, at no cost and with no watermark.",
              },
              {
                question: "Can I use this on my phone?",
                answer:
                  "Yes. On a small screen the editor and the preview swap with an Edit/Preview toggle rather than sitting side by side, and the controls are sized for touch.",
              },
              {
                question: "Where are my invoices stored?",
                answer:
                  "In your browser, using IndexedDB. They are not uploaded. If you sign in with Google you can additionally choose to save a specific invoice to your account so it is available on other devices.",
              },
            ]}
          />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            softwareApplicationSchema({
              name: "Invoice Generator",
              description: DESCRIPTION,
              path: "/invoice-generator",
            }),
          ),
        }}
      />
    </>
  );
}
