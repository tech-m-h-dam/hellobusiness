import { faqSchema, jsonLd } from "@/lib/seo/metadata";

export type Faq = { question: string; answer: string };

/**
 * FAQ block rendered as semantic HTML (visible to users and crawlers without
 * JavaScript) plus matching FAQPage JSON-LD. Uses <details>/<summary> so it is
 * keyboard-accessible and expandable with zero client JS.
 */
export function FaqSection({ items, title = "Frequently asked questions" }: { items: Faq[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl">
      <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-ink-900">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-ink-200 border-y border-ink-200">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink-900 marker:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-ink-400 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{item.answer}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(items)) }} />
    </section>
  );
}
