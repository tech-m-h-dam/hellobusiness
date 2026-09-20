import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FaqSection } from "@/components/seo/FaqSection";
import { GuideBody } from "@/components/blog/GuideBody";
import { AdSlot } from "@/components/ads/AdSlot";
import { GUIDES, getGuide } from "@/lib/content/guides";
import { articleSchema, generateMetadata as buildMetadata, jsonLd } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildMetadata({
    title: guide.seoTitle,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: "article",
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function GuidePage(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]}
        />
      </div>

      <article className="mx-auto max-w-3xl px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{guide.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-500">
            <span>{SITE_NAME}</span>
            <span>Published {formatDate(guide.publishedAt)}</span>
            {guide.updatedAt && <span>Updated {formatDate(guide.updatedAt)}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" /> {guide.readingMinutes} min read
            </span>
          </div>
        </header>

        {/* Direct answer first, for readers and answer engines alike. */}
        <p className="mt-8 rounded-xl border-l-4 border-brand-500 bg-brand-50/50 p-5 text-[16px] leading-relaxed text-ink-800">
          {guide.answer}
        </p>

        <div className="mt-8">
          <GuideBody blocks={guide.blocks} />
        </div>

        <div className="my-10">
          <AdSlot slot="guide-inline" />
        </div>

        {guide.faqs && guide.faqs.length > 0 && (
          <div className="mt-12">
            <FaqSection items={guide.faqs} />
          </div>
        )}

        <footer className="mt-12 border-t border-ink-200 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Related</h2>
          <ul className="mt-4 space-y-2">
            {guide.related.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-700 hover:text-brand-800"
                >
                  {item.label} <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-6">
            <p className="text-[15px] font-semibold text-ink-900">Ready to create an invoice?</p>
            <p className="mt-1 text-[14px] text-ink-600">
              The free invoice generator runs in your browser — no signup, and a PDF at the end.
            </p>
            <Link
              href="/invoice-generator"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Create Free Invoice
            </Link>
          </div>
        </footer>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            articleSchema({
              headline: guide.title,
              description: guide.description,
              path: `/guides/${guide.slug}`,
              publishedTime: guide.publishedAt,
              modifiedTime: guide.updatedAt,
            }),
          ),
        }}
      />
    </>
  );
}
