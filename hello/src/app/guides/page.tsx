import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { GUIDES } from "@/lib/content/guides";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Invoicing Guides — How to Invoice, Get Paid and Handle Tax",
  description:
    "Practical guides to invoicing: how to create an invoice, what to include, numbering, payment terms, tax and discount calculation, and chasing late payments.",
  path: "/guides",
});

export default function GuidesPage() {
  const categories = Array.from(new Set(GUIDES.map((g) => g.category)));

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }]} />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Invoicing guides</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
          Straightforward explanations of the things that actually determine whether an invoice gets
          paid — what to put on it, how to calculate tax and discounts correctly, which payment terms
          work, and what to do when an invoice goes overdue.
        </p>

        {categories.map((category) => (
          <div key={category} className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{category}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDES.filter((g) => g.category === category).map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <h3 className="text-[15px] font-semibold text-ink-900 group-hover:text-brand-700">
                      {guide.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-600">
                      {guide.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-ink-500">
                      <Clock className="size-3.5" aria-hidden="true" /> {guide.readingMinutes} min read
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
