import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { GUIDES } from "@/lib/content/guides";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

/**
 * Blog index.
 *
 * Editorial posts are managed through the admin CMS (BlogPost in the Prisma
 * schema). Until posts are published, this page lists the guides rather than
 * showing an empty shell — an indexable page with nothing on it is worse than
 * no page at all.
 */
export const metadata: Metadata = buildMetadata({
  title: "Blog — Invoicing, Getting Paid and Running a Small Business",
  description:
    "Articles on invoicing, payment terms, tax handling and getting paid on time, from the team behind the free invoice generator.",
  path: "/blog",
});

export default function BlogPage() {
  const recent = [...GUIDES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Blog</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
          Writing on invoicing and getting paid. Our in-depth reference material lives in the{" "}
          <Link href="/guides" className="text-brand-700 underline underline-offset-2">
            guides section
          </Link>
          ; the most recent pieces are below.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="group flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <span className="text-[12px] font-medium uppercase tracking-wide text-brand-700">
                  {guide.category}
                </span>
                <h2 className="mt-2 text-[15px] font-semibold text-ink-900 group-hover:text-brand-700">
                  {guide.title}
                </h2>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-600">
                  {guide.description}
                </p>
                <time dateTime={guide.publishedAt} className="mt-4 text-[12px] text-ink-500">
                  {new Date(guide.publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
