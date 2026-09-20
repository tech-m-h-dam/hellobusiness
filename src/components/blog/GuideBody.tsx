import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import type { GuideBlock } from "@/lib/content/guides";

/**
 * Renders authored content blocks as markup.
 *
 * Content is structured data, never an HTML string, so there is no
 * dangerouslySetInnerHTML anywhere in the editorial path — an author (or later,
 * a CMS row) cannot inject script, and typography stays consistent because this
 * component owns every element.
 */
export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="prose-doc">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h2 key={i}>{block.text}</h2>;
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "p":
            return <p key={i}>{block.text}</p>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "callout":
            return (
              <aside
                key={i}
                className="my-6 flex gap-3 rounded-lg border border-brand-200 bg-brand-50/60 p-4 text-[14px] text-ink-700"
              >
                <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                <p className="m-0">{block.text}</p>
              </aside>
            );
          case "cta":
            return (
              <aside key={i} className="my-6 rounded-xl border border-ink-200 bg-ink-50 p-5">
                <p className="m-0 text-[14px] text-ink-700">{block.text}</p>
                <Link
                  href={block.href}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 no-underline hover:text-brand-800"
                >
                  {block.label} <ArrowRight className="size-3.5" />
                </Link>
              </aside>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
