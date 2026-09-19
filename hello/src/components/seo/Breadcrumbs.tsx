import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbSchema, jsonLd, type Breadcrumb } from "@/lib/seo/metadata";

/** Visible breadcrumb trail plus matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {isLast ? (
                <span aria-current="page" className="text-ink-700">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="transition-colors hover:text-brand-700">
                    {item.name}
                  </Link>
                  <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(items)) }}
      />
    </nav>
  );
}
