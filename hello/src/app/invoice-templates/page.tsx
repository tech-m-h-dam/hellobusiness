import Link from "next/link";
import type { Metadata } from "next";
import { TemplateThumb } from "@/components/invoice/TemplateThumb";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/invoice/templates";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: `${TEMPLATES.length} Free Invoice Templates — Download & Customize`,
  description: `Browse ${TEMPLATES.length} free professional invoice templates — minimal, modern, corporate, GST, freelance and product styles. Customize colors and columns, then download a PDF. No signup.`,
  path: "/invoice-templates",
});

export default function InvoiceTemplatesPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Invoice Templates", path: "/invoice-templates" },
          ]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Free Invoice Templates
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
          {TEMPLATES.length} professional invoice templates you can use free, with no signup and no
          watermark. Every template uses the same invoice data, so you can switch between them at any
          point without re-entering anything — try one, change your mind, and your work is still there.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => (
            <li key={template.id}>
              <Link
                href={`/invoice-templates/${template.id}`}
                className="group block rounded-xl border border-ink-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <TemplateThumb templateId={template.id} className="h-40 w-full" />
                <p className="mt-3 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                  {template.name}
                </p>
                <p className="text-[12px] text-ink-500">{template.category}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{template.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="prose-doc">
          <h2>Choosing an invoice template</h2>
          <p>
            The right template mostly depends on how much information each line of your invoice has to
            carry, and how formal your client relationship is.
          </p>
          <table>
            <thead>
              <tr>
                <th>If you…</th>
                <th>Start with</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bill a handful of lines for services</td>
                <td><Link href="/invoice-templates/minimal">Minimal</Link> or <Link href="/invoice-templates/freelancer">Freelancer</Link></td>
              </tr>
              <tr>
                <td>Invoice large organisations</td>
                <td><Link href="/invoice-templates/corporate">Corporate</Link> or <Link href="/invoice-templates/professional">Professional</Link></td>
              </tr>
              <tr>
                <td>Need HSN/SAC and a GST breakdown</td>
                <td><Link href="/invoice-templates/gst-classic">GST Classic</Link></td>
              </tr>
              <tr>
                <td>Sell physical products with photos</td>
                <td><Link href="/invoice-templates/retail">Retail</Link> or <Link href="/invoice-templates/product">Product</Link></td>
              </tr>
              <tr>
                <td>Have dozens of line items per invoice</td>
                <td><Link href="/invoice-templates/compact-mono">Compact Mono</Link></td>
              </tr>
              <tr>
                <td>Want the invoice to look designed</td>
                <td><Link href="/invoice-templates/creative">Creative</Link> or <Link href="/invoice-templates/modern">Modern</Link></td>
              </tr>
            </tbody>
          </table>
          <p>
            Whichever you pick, you can change the colours, fonts, margins, table style and which
            columns appear — so a template is a starting point, not a constraint. If you want to start
            straight away, open the{" "}
            <Link href="/invoice-generator">free invoice generator</Link>.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">Browse by style</h2>
          <ul className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((category) => (
              <li
                key={category}
                className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-700"
              >
                {category}
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <FaqSection
              items={[
                {
                  question: "Are these invoice templates really free?",
                  answer:
                    "Yes. Every template is free to use with no signup, no watermark and no limit on how many invoices you create.",
                },
                {
                  question: "Can I switch templates after filling in my invoice?",
                  answer:
                    "Yes, at any point. Templates only control the layout and styling — your business details, customer, line items, taxes and everything else stay exactly as you entered them.",
                },
                {
                  question: "Can I customize a template's colors and fonts?",
                  answer:
                    "Yes. Every template's colours, fonts, text sizes, margins, table style and visible columns can be changed in the Design tab, and you can hide any section you don't need.",
                },
                {
                  question: "What format can I download the invoice in?",
                  answer:
                    "PDF, generated in your browser with selectable text. You can also print directly, which lets you use your browser's own save-as-PDF if you prefer.",
                },
              ]}
            />
          </div>
        </div>
      </section>
    </>
  );
}
