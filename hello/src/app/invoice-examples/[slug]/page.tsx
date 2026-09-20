import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { InvoiceDocument } from "@/components/invoice/document/InvoiceDocument";
import { UseThisFormatButton } from "@/components/invoice/UseThisFormatButton";
import { EXAMPLES, getExample } from "@/lib/content/examples";
import { computeTotals } from "@/lib/invoice/calculations";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(
  props: PageProps<"/invoice-examples/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const example = getExample(slug);
  if (!example) return {};
  return buildMetadata({
    title: example.title,
    description: example.description,
    path: `/invoice-examples/${example.slug}`,
  });
}

export default async function ExamplePage(props: PageProps<"/invoice-examples/[slug]">) {
  const { slug } = await props.params;
  const example = getExample(slug);
  if (!example) notFound();

  // Rendered on the server at build time — the example document is static HTML.
  const invoice = example.build();
  const totals = computeTotals(invoice);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Invoice Examples", path: "/invoice-examples" },
            { name: example.name, path: `/invoice-examples/${example.slug}` },
          ]}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{example.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">{example.intro}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* The example document itself, rendered by the real renderer. */}
          <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-ink-200">
            <div className="origin-top-left scale-[0.62] sm:scale-75 lg:scale-[0.62] xl:scale-75">
              <InvoiceDocument invoice={invoice} totals={totals} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink-900">What this example shows</h2>
            <ul className="mt-4 space-y-3">
              {example.notes.map((note) => (
                <li key={note} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {note}
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-lg font-semibold text-ink-900">Fields included</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {example.fieldsIncluded.map((field) => (
                <li
                  key={field}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[12.5px] text-ink-600"
                >
                  {field}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-5">
              <p className="text-[15px] font-semibold text-ink-900">Create an invoice using this format</p>
              <p className="mt-1 text-[13.5px] text-ink-600">
                Loads this example into the editor so you can replace the details with your own. It
                stays in your browser.
              </p>
              <div className="mt-4">
                <UseThisFormatButton slug={example.slug} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={example.relatedTool.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                {example.relatedTool.label} <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={example.relatedGuide.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                {example.relatedGuide.label} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">Other invoice examples</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.filter((e) => e.slug !== example.slug)
              .slice(0, 6)
              .map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/invoice-examples/${other.slug}`}
                    className="block rounded-xl border border-ink-200 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-ink-900">{other.name}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{other.description}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </>
  );
}
