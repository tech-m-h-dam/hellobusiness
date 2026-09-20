import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EXAMPLES } from "@/lib/content/examples";
import { TemplateThumb } from "@/components/invoice/TemplateThumb";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Invoice Examples — Filled-In Samples for Every Kind of Work",
  description:
    "Real, filled-in invoice examples for freelancers, consultants, contractors, developers, product sales, services and GST. See the format, then use it.",
  path: "/invoice-examples",
});

export default function InvoiceExamplesPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[{ name: "Home", path: "/" }, { name: "Invoice Examples", path: "/invoice-examples" }]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Invoice examples</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
          Complete, filled-in invoices for different kinds of work — so you can see what a good one
          actually looks like before you write your own. Each example is rendered by the same engine
          that produces your invoice, so what you see is exactly what the tool creates.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((example) => (
            <li key={example.slug}>
              <Link
                href={`/invoice-examples/${example.slug}`}
                className="group flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <TemplateThumb templateId={example.build().templateId} className="h-32 w-full" />
                <h2 className="mt-4 text-[15px] font-semibold text-ink-900 group-hover:text-brand-700">
                  {example.name}
                </h2>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-600">
                  {example.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
