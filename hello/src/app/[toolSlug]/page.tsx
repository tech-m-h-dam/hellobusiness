/**
 * Invoice-type landing pages (/gst-invoice-generator, /freelance-invoice-generator, …).
 *
 * One route renders them all from the content registry in
 * lib/content/invoice-types.ts. `dynamicParams = false` means only the slugs
 * returned by generateStaticParams resolve — anything else 404s rather than
 * rendering an empty page, so this dynamic segment can sit at the root without
 * swallowing unknown URLs. Static routes (/blog, /guides, /privacy) take
 * precedence over this segment, which is how the App Router resolves conflicts.
 *
 * Every page here is fully prerendered at build time: static HTML on the CDN,
 * zero database queries, with the editor mounted as the only client island.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";
import { googleConfigured } from "@/lib/auth/status";
import { FaqSection } from "@/components/seo/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { AdSlot } from "@/components/ads/AdSlot";
import { INVOICE_TYPES, getInvoiceType } from "@/lib/content/invoice-types";
import { getTemplate } from "@/lib/invoice/templates";
import { generateMetadata as buildMetadata, jsonLd, softwareApplicationSchema } from "@/lib/seo/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return INVOICE_TYPES.map((type) => ({ toolSlug: type.slug }));
}

export async function generateMetadata(props: PageProps<"/[toolSlug]">): Promise<Metadata> {
  const { toolSlug } = await props.params;
  const content = getInvoiceType(toolSlug);
  if (!content) return {};
  return buildMetadata({
    title: content.title,
    description: content.description,
    path: `/${content.slug}`,
  });
}

export default async function InvoiceTypePage(props: PageProps<"/[toolSlug]">) {
  const { toolSlug } = await props.params;
  const content = getInvoiceType(toolSlug);
  if (!content) notFound();

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: content.h1, path: `/${content.slug}` },
          ]}
        />
      </div>

      {/* Hero + direct answer --------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{content.h1}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">{content.intro}</p>
        </div>
      </section>

      {/* The tool, pre-configured for this invoice type --------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <InvoiceEditor
          initialTemplateId={content.templateId}
          initialSettings={content.settings}
          authAvailable={googleConfigured}
        />
      </section>

      <div className="mx-auto max-w-5xl px-4">
        <AdSlot slot="tool-below" />
      </div>

      {/* What's different about this invoice type --------------------------- */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight text-ink-900">
          What this sets up for you
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {content.highlights.map((item) => (
            <li key={item.heading} className="rounded-xl border border-ink-200 bg-white p-5">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink-900">
                <Check className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                {item.heading}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Long-form content -------------------------------------------------- */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="prose-doc">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Related templates -------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">Recommended templates</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {content.relatedTemplates.map((id) => {
              const template = getTemplate(id);
              return (
                <li key={id}>
                  <Link
                    href={`/invoice-templates/${template.id}`}
                    className="block rounded-xl border border-ink-200 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <span
                      className="mb-3 block h-2 w-12 rounded"
                      style={{ backgroundColor: template.settings.primaryColor }}
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold text-ink-900">{template.name}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{template.description}</p>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap gap-6">
            {content.relatedGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                {guide.label} <ArrowRight className="size-3.5" />
              </Link>
            ))}
            {content.relatedExample && (
              <Link
                href={`/invoice-examples/${content.relatedExample}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                See a filled-in example <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FAQ ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <FaqSection items={content.faqs} />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            softwareApplicationSchema({
              name: content.h1,
              description: content.description,
              path: `/${content.slug}`,
            }),
          ),
        }}
      />
    </>
  );
}
