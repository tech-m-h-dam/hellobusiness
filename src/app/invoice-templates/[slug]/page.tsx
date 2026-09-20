import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import { googleConfigured } from "@/lib/auth/status";
import { TemplateThumb } from "@/components/invoice/TemplateThumb";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { TEMPLATES } from "@/lib/invoice/templates";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }));
}

export async function generateMetadata(
  props: PageProps<"/invoice-templates/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const template = TEMPLATES.find((t) => t.id === slug);
  if (!template) return {};
  return buildMetadata({
    title: `${template.name} Invoice Template — Free, Customizable, PDF`,
    description: `${template.description} Use the ${template.name.toLowerCase()} invoice template free — customize the colors and columns, then download a PDF. No signup required.`,
    path: `/invoice-templates/${template.id}`,
  });
}

/** Layout-specific copy, so each template page says something true and specific. */
const LAYOUT_NOTES: Record<string, string> = {
  classic:
    "The classic layout puts your business details and logo top-left with the invoice number, date and due date top-right, separated by a rule above the item table. It is the arrangement most finance teams expect, which makes it the safest default for invoices that will be processed by someone who has never seen your work.",
  banner:
    "The banner layout runs a full-width colour band across the top of the page carrying your logo, business details and the document title. It makes the invoice recognisably yours at a glance, and works particularly well when your brand has a strong colour.",
  sidebar:
    "The sidebar layout moves your business details, the bill-to block and your payment details into a coloured column down the left of the page, leaving the full width of the remaining area for the item table. It suits invoices with a lot of payment information to convey.",
  split:
    "The split layout pairs your business details on the left with a coloured panel on the right holding the invoice number, date and due date. The key dates are the most prominent thing on the page, which tends to help with getting paid on time.",
  compact:
    "The compact layout tightens the type and spacing so substantially more line items fit on a page. If your invoices routinely run to dozens of lines, this keeps them to fewer pages without shrinking the type to the point of illegibility.",
};

export default async function TemplatePage(props: PageProps<"/invoice-templates/[slug]">) {
  const { slug } = await props.params;
  const template = TEMPLATES.find((t) => t.id === slug);
  if (!template) notFound();

  const related = TEMPLATES.filter((t) => t.id !== template.id && t.category === template.category).slice(0, 3);
  const alsoSee = TEMPLATES.filter((t) => t.id !== template.id).slice(0, 4);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Invoice Templates", path: "/invoice-templates" },
            { name: template.name, path: `/invoice-templates/${template.id}` },
          ]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <TemplateThumb templateId={template.id} className="h-56 w-full max-w-xs shrink-0" />
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium uppercase tracking-wide text-brand-700">
              {template.category} template
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {template.name} Invoice Template
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">{template.description}</p>
            <p className="mt-3 leading-relaxed text-ink-600">
              It is free to use, has no watermark, and downloads as a PDF. Fill it in below — the
              template is already applied, and you can change the colours, fonts and columns at any
              point without losing what you have typed.
            </p>
            <a
              href="#use-template"
              className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Use this template
            </a>
          </div>
        </div>
      </section>

      <section id="use-template" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-10">
        <InvoiceEditor initialTemplateId={template.id} authAvailable={googleConfigured} />
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="prose-doc">
          <h2>About the {template.name.toLowerCase()} layout</h2>
          <p>{LAYOUT_NOTES[template.layout]}</p>
          <h2>What you can change</h2>
          <p>
            This template sets a starting point — a {template.settings.tableStyle} table,{" "}
            {template.settings.fontFamily === "Times-Roman"
              ? "a serif typeface"
              : template.settings.fontFamily === "Courier"
                ? "a monospace typeface"
                : "a sans-serif typeface"}
            , and its own accent colour. From the Design tab you can change the accent colour, switch
            the font, adjust text sizes and page margins, change the table style, and show or hide any
            column — row numbers, item images, SKU, HSN/SAC, discount and tax. You can also hide whole
            sections such as notes, terms, the signature block or payment details.
          </p>
          <p>
            Prefer to start from a different angle? Browse{" "}
            <Link href="/invoice-templates">all invoice templates</Link>, or open the general{" "}
            <Link href="/invoice-generator">invoice generator</Link>.
          </p>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            {related.length ? `More ${template.category.toLowerCase()} templates` : "Other templates"}
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(related.length ? related : alsoSee).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/invoice-templates/${t.id}`}
                  className="group block rounded-xl border border-ink-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <TemplateThumb templateId={t.id} className="h-32 w-full" />
                  <p className="mt-3 text-sm font-semibold text-ink-900 group-hover:text-brand-700">{t.name}</p>
                  <p className="text-[12px] text-ink-500">{t.category}</p>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/invoice-templates"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View all {TEMPLATES.length} templates <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <FaqSection
          items={[
            {
              question: `Is the ${template.name.toLowerCase()} invoice template free?`,
              answer:
                "Yes — free to use, no signup, no watermark, and unlimited invoices and PDF downloads.",
            },
            {
              question: "Will I lose my data if I switch to another template?",
              answer:
                "No. Templates only control layout and styling. Your business details, customer, line items, taxes and totals are kept exactly as entered.",
            },
            {
              question: "Can I change the colors in this template?",
              answer:
                "Yes. Open the Design tab and set any accent colour you like, along with fonts, text sizes, margins and table style.",
            },
            {
              question: "Can I download this template as a PDF?",
              answer:
                "Yes. Click Download PDF and the file is generated in your browser — the text stays selectable and searchable, and long invoices break across pages without splitting rows.",
            },
          ]}
        />
      </section>
    </>
  );
}
