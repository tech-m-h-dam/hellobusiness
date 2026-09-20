"use client";

/**
 * Account-saved invoice history.
 *
 * The list is rendered from metadata only; the full invoice payload is fetched
 * on demand when someone opens one, so loading the profile never ships every
 * invoice's contents (and its embedded images) to the browser.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeTotals } from "@/lib/invoice/calculations";
import { invoiceSchema } from "@/lib/invoice/validation";
import { track } from "@/lib/analytics/track";
import { openInvoiceInEditor } from "@/stores/invoice-editor";

export type AccountInvoiceSummary = {
  id: string;
  invoiceNumber: string;
  title: string | null;
  templateId: string;
  updatedAt: string;
};

export function AccountInvoiceList({ invoices }: { invoices: AccountInvoiceSummary[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(invoices);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Fetch one saved invoice and validate it before it re-enters the app. */
  async function fetchInvoice(id: string) {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) throw new Error("Could not load that invoice");
    const data = (await res.json()) as { invoice: unknown };
    // Anything coming back from storage is re-validated: it may have been
    // written by an older version of the app.
    const parsed = invoiceSchema.safeParse(data.invoice);
    if (!parsed.success) throw new Error("That invoice could not be read");
    return parsed.data;
  }

  async function open(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const invoice = await fetchInvoice(id);
      await openInvoiceInEditor(invoice);
      track("saved_invoice_opened");
      router.push("/invoice-generator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function download(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const invoice = await fetchInvoice(id);
      const { renderInvoicePdf, pdfFilename } = await import("@/lib/invoice/pdf");
      const blob = await renderInvoicePdf(invoice, computeTotals(invoice));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfFilename(invoice);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the PDF");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, number: string) {
    if (!confirm(`Delete invoice ${number} from your account? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
      else setError("Could not delete that invoice");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-300 p-10 text-center text-[14px] text-ink-600">
        No invoices saved to your account yet. Download an invoice and choose{" "}
        <em>Save to my account</em> to keep it here.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700" role="alert">
          {error}
        </p>
      )}
      <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink-900">{row.invoiceNumber}</p>
              <p className="truncate text-[13px] text-ink-600">
                {row.title || "Untitled"} ·{" "}
                {new Date(row.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {busyId === row.id ? (
              <Loader2 className="size-4 animate-spin text-ink-400" />
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => open(row.id)} aria-label={`Edit ${row.invoiceNumber}`}>
                  <Pencil className="text-ink-400" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => download(row.id)} aria-label={`Download ${row.invoiceNumber}`}>
                  <Download className="text-ink-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(row.id, row.invoiceNumber)}
                  aria-label={`Delete ${row.invoiceNumber}`}
                >
                  <Trash2 className="text-ink-400" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
