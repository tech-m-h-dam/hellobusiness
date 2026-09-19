"use client";

/**
 * Download / print actions.
 *
 * The PDF engine (@react-pdf/renderer, ~400KB) is imported dynamically inside
 * the click handler, so it is fetched the first time someone actually downloads
 * — never as part of any page's initial JavaScript (spec sections 36, 66).
 *
 * Failure is handled explicitly rather than swallowed: if PDF generation
 * throws, the user is told their invoice is still safe in this browser and
 * offered the print fallback, which produces the same document through the
 * browser's own PDF writer.
 */
import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { track } from "@/lib/analytics/track";

export function DownloadButton({ onDownloaded }: { onDownloaded?: () => void }) {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const totals = useInvoiceEditor((s) => s.totals);
  const saveToHistory = useInvoiceEditor((s) => s.saveToHistory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const { renderInvoicePdf, pdfFilename } = await import("@/lib/invoice/pdf");
      const blob = await renderInvoicePdf(invoice, totals);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfFilename(invoice);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Release the blob on the next tick, once the download has been handed off.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      await saveToHistory();
      track("pdf_downloaded");
      onDownloaded?.();
    } catch (err) {
      console.error("[pdf] generation failed", err);
      setError(
        "We couldn't generate the PDF. Your invoice is still saved in this browser — try again, or use Print to save as PDF.",
      );
      track("pdf_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button type="button" onClick={download} disabled={busy} className="flex-1">
          {busy ? <Loader2 className="animate-spin" /> : <Download />}
          {busy ? "Preparing PDF…" : "Download PDF"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            track("invoice_printed");
            window.print();
          }}
          aria-label="Print invoice"
        >
          <Printer />
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
