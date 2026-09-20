"use client";

/**
 * Live preview pane.
 *
 * Renders the real document at true page geometry and scales it to fit the
 * available column width, so what is on screen is exactly what prints. The
 * wrapper reserves the scaled height explicitly — without that, the CSS
 * transform would leave a large empty gap below the sheet (and shift layout
 * as the invoice grows, hurting CLS).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { InvoiceDocument } from "./document/InvoiceDocument";
import { InlineField } from "./InlineField";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import type { InlineEdit } from "@/lib/invoice/inline-edit";

/** Page width in CSS pixels at 96dpi: A4 = 210mm, Letter = 215.9mm. */
const PAGE_PX = { A4: 794, Letter: 816 } as const;

/** Zoom steps offered for the preview, as a multiple of fit-to-column. */
const ZOOM_STEPS = [1, 1.25, 1.5, 2] as const;

export function InvoicePreview({ editable = true }: { editable?: boolean }) {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const totals = useInvoiceEditor((s) => s.totals);
  const update = useInvoiceEditor((s) => s.update);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [height, setHeight] = useState<number>(0);

  // Fit-to-column, multiplied by the user's zoom. Capped at 1 for fit so a
  // narrow column never blows the document up past its true size by accident.
  const scale = fitScale * zoom;

  /**
   * The inline-editing API handed to the document renderer. Building it here
   * (rather than inside the renderer) is what keeps the renderer itself
   * server-compatible — see lib/invoice/inline-edit.ts.
   */
  /**
   * Inline editing is gated on pointer type, not on screen size or zoom.
   *
   * The document renders at roughly half size in a narrow column, so its tap
   * targets are a few pixels tall. A mouse hits those comfortably; a finger
   * does not. Touch-primary devices therefore get a faithful read-only preview
   * and do their editing in the touch-sized form behind the Edit/Preview
   * toggle, which is what that toggle is for.
   *
   * Defaults to enabled so server and first client render agree; the media
   * query result is only available in the browser.
   */
  const [coarsePointer, setCoarsePointer] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const inlineEditable = editable && !coarsePointer;

  const edit = useMemo<InlineEdit | undefined>(
    () =>
      inlineEditable
        ? {
            patch: (updater) => update(updater),
            field: (spec) => <InlineField key={spec.ariaLabel} {...spec} />,
          }
        : undefined,
    [inlineEditable, update],
  );

  /**
   * The copy that actually goes on paper.
   *
   * Printing the interactive document meant printing its editing affordances:
   * every empty field renders its placeholder so it stays clickable, so an
   * invoice with no PO number printed the words "PO #: —", and a half-filled
   * address printed "Street address" / "City, State, Postal code". A field left
   * open when the dialog was invoked printed as a focused text input.
   *
   * Rendering the document a second time without `edit` sidesteps all of it:
   * what prints is byte-for-byte the document the static example pages and the
   * PDF render. It is memoised on the data alone, so zooming or resizing the
   * preview column does not re-render it.
   */
  const printable = useMemo(
    () => (
      <div className="hidden print:block">
        <InvoiceDocument invoice={invoice} totals={totals} />
      </div>
    ),
    [invoice, totals],
  );

  const landscape = invoice.settings.orientation === "landscape";
  const pageWidthPx = landscape
    ? invoice.settings.pageSize === "A4"
      ? 1123
      : 1056
    : PAGE_PX[invoice.settings.pageSize];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const recalc = () => {
      const available = container.clientWidth;
      const next = Math.min(1, available / pageWidthPx);
      setFitScale(next);
      const sheetHeight = sheetRef.current?.firstElementChild?.getBoundingClientRect().height;
      if (sheetHeight) setHeight(sheetHeight);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageWidthPx, invoice]);

  const zoomIndex = ZOOM_STEPS.indexOf(zoom as (typeof ZOOM_STEPS)[number]);

  return (
    <div ref={containerRef} className="w-full">
      {/*
       * Zoom control. The preview column is deliberately the narrower of the
       * two, so a full page inside it renders small; this lets the document be
       * enlarged for reading or for precise inline edits without giving up the
       * side-by-side layout.
       */}
      <div data-print="hide" className="mb-2 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setZoom(ZOOM_STEPS[Math.max(0, zoomIndex - 1)])}
          disabled={zoomIndex <= 0}
          aria-label="Zoom out"
          className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 disabled:opacity-40"
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="min-w-12 text-center text-[12px] tabular-nums text-ink-500">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1)])}
          disabled={zoomIndex >= ZOOM_STEPS.length - 1}
          aria-label="Zoom in"
          className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 disabled:opacity-40"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          aria-label="Fit to width"
          className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 disabled:opacity-40"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
      {/*
       * `data-print="sheet"` marks the fit-to-column wrapper. Both the CSS
       * scale transform and the explicit pixel height below exist purely to fit
       * a real page-sized sheet into the preview column; when printing, the
       * page *is* the page, so globals.css resets both. Without that reset the
       * invoice prints at whatever the preview happened to be scaled to and is
       * clipped to the on-screen height.
       */}
      <div
        ref={sheetRef}
        data-print="sheet"
        style={{ height: height || undefined }}
        className={`rounded-lg shadow-lg ring-1 ring-ink-200 print:hidden ${
          // Zoomed in, the sheet is wider than its column, so it scrolls
          // horizontally instead of being cut off.
          zoom > 1 ? "overflow-auto" : "overflow-hidden"
        }`}
      >
        <InvoiceDocument
          invoice={invoice}
          totals={totals}
          scale={scale}
          edit={edit}
          printTarget={false}
        />
      </div>
      {printable}
    </div>
  );
}
