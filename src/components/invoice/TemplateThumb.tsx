import { getTemplate } from "@/lib/invoice/templates";

/**
 * A CSS-drawn miniature of a template.
 *
 * Deliberately not an image: there are 20 templates and their styling comes
 * from data, so rendering the thumbnail from the same data means a preset's
 * colours can never drift out of sync with a stale screenshot — and it costs
 * no image requests, no layout shift and no CDN storage.
 */
export function TemplateThumb({ templateId, className = "" }: { templateId: string; className?: string }) {
  const t = getTemplate(templateId);
  const color = t.settings.primaryColor;
  const layout = t.layout;

  return (
    <span
      className={`flex overflow-hidden rounded-lg border border-ink-200 bg-white ${className}`}
      aria-hidden="true"
    >
      {layout === "sidebar" && <span className="block w-1/4 shrink-0" style={{ backgroundColor: color }} />}
      <span className="flex min-w-0 flex-1 flex-col">
        {layout === "banner" && <span className="block h-1/4 w-full" style={{ backgroundColor: color }} />}
        <span className="flex flex-1 flex-col gap-1 p-2">
          {layout === "split" && (
            <span className="mb-1 flex items-start justify-between gap-2">
              <span className="block h-1.5 w-1/3 rounded bg-ink-300" />
              <span className="block h-4 w-1/3 rounded" style={{ backgroundColor: color }} />
            </span>
          )}
          {(layout === "classic" || layout === "compact") && (
            <span className="mb-1 flex items-center justify-between gap-2">
              <span className="block h-1.5 w-1/3 rounded bg-ink-300" />
              <span className="block h-1.5 w-1/4 rounded" style={{ backgroundColor: color }} />
            </span>
          )}
          <span className="block h-1 w-full rounded" style={{ backgroundColor: color, opacity: 0.85 }} />
          <span className="block h-1 w-full rounded bg-ink-100" />
          <span className="block h-1 w-full rounded bg-ink-100" />
          <span className="block h-1 w-5/6 rounded bg-ink-100" />
          {layout !== "compact" && <span className="block h-1 w-4/6 rounded bg-ink-100" />}
          <span className="mt-auto block h-2 w-1/3 self-end rounded" style={{ backgroundColor: color }} />
        </span>
      </span>
    </span>
  );
}
