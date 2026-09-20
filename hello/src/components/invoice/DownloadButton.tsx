"use client";

/**
 * Download / print actions.
 *
 * Both export engines (@react-pdf/renderer for PDF, `docx` for Word) are
 * imported dynamically inside their click handlers, so neither is fetched until
 * someone actually exports — they never enter any page's initial JavaScript.
 *
 * Failure is handled explicitly rather than swallowed: if an export throws, the
 * user is told their invoice is still safe in this browser and offered the
 * print fallback, which produces the same document through the browser's own
 * PDF writer.
 */
import { useState } from "react";
import { ChevronDown, Download, FileText, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { track } from "@/lib/analytics/track";
import { useT } from "@/lib/i18n/use-locale";

type Busy = null | "pdf" | "docx";

/** Hand a generated Blob to the browser as a file download. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Release the object URL once the download has been handed off.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DownloadButton({ onDownloaded }: { onDownloaded?: () => void }) {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const totals = useInvoiceEditor((s) => s.totals);
  const saveToHistory = useInvoiceEditor((s) => s.saveToHistory);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  async function downloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const { renderInvoicePdf, pdfFilename } = await import("@/lib/invoice/pdf");
      const blob = await renderInvoicePdf(invoice, totals);
      saveBlob(blob, pdfFilename(invoice));
      await saveToHistory();
      track("pdf_downloaded");
      onDownloaded?.();
    } catch (err) {
      console.error("[pdf] generation failed", err);
      setError(
        "We couldn't generate the PDF. Your invoice is still saved in this browser — try again, download it as Word, or use Print to save as PDF.",
      );
      track("pdf_failed");
    } finally {
      setBusy(null);
    }
  }

  async function downloadDocx() {
    setBusy("docx");
    setError(null);
    try {
      const { renderInvoiceDocx, docxFilename } = await import("@/lib/invoice/docx");
      const blob = await renderInvoiceDocx(invoice, totals);
      saveBlob(blob, docxFilename(invoice));
      await saveToHistory();
      track("docx_downloaded");
      onDownloaded?.();
    } catch (err) {
      console.error("[docx] generation failed", err);
      setError(
        "We couldn't generate the Word file. Your invoice is still saved in this browser — try again, or download it as a PDF.",
      );
      track("docx_failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full gap-2">
        {/* Primary action stays a single click; Word sits behind the caret so
            the common case is never a two-step interaction.
            `min-w-0` lets this group shrink instead of pushing Print out of the
            toolbar — without it the row overflows and forces page scroll. */}
        <div className="flex min-w-0 flex-1">
          <Button
            type="button"
            onClick={downloadPdf}
            disabled={busy !== null}
            className="min-w-0 flex-1 rounded-r-none"
          >
            {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />}
            <span className="truncate">{busy === "pdf" ? t("preparing") : t("downloadPdf")}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                disabled={busy !== null}
                aria-label={t("moreFormats")}
                className="shrink-0 rounded-l-none border-l border-brand-500 px-2"
              >
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void downloadPdf()}>
                <Download className="mr-2 size-4" /> {t("downloadPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void downloadDocx()}>
                <FileText className="mr-2 size-4" /> {t("downloadWord")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            track("invoice_printed");
            window.print();
          }}
          aria-label={t("print")}
        >
          <Printer />
          <span className="hidden sm:inline">{t("print")}</span>
        </Button>
      </div>

      {busy === "docx" && (
        <p className="text-[12px] text-ink-500" role="status">
          Preparing your Word document…
        </p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
