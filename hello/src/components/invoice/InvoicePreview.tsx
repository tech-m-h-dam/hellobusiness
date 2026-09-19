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
import { useEffect, useRef, useState } from "react";
import { InvoiceDocument } from "./document/InvoiceDocument";
import { useInvoiceEditor } from "@/stores/invoice-editor";

/** Page width in CSS pixels at 96dpi: A4 = 210mm, Letter = 215.9mm. */
const PAGE_PX = { A4: 794, Letter: 816 } as const;

export function InvoicePreview() {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const totals = useInvoiceEditor((s) => s.totals);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>(0);

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
      setScale(next);
      const sheetHeight = sheetRef.current?.firstElementChild?.getBoundingClientRect().height;
      if (sheetHeight) setHeight(sheetHeight);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageWidthPx, invoice]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        ref={sheetRef}
        style={{ height: height || undefined }}
        className="overflow-hidden rounded-lg shadow-lg ring-1 ring-ink-200 print:overflow-visible print:rounded-none print:shadow-none print:ring-0"
      >
        <InvoiceDocument invoice={invoice} totals={totals} scale={scale} />
      </div>
    </div>
  );
}
