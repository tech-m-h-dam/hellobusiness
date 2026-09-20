"use client";

/**
 * Invoice history, local-first.
 *
 * Local history (IndexedDB) is the primary source and is always shown. Account
 * history is fetched only when signed in, and merged in — an invoice saved to
 * the account and also present locally appears once, with the account copy
 * marked so the user knows it will follow them to another device.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cloud, Copy, Download, HardDrive, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoiceStore, type InvoiceHistoryEntry } from "@/lib/invoice/storage";
import { openInvoiceInEditor } from "@/stores/invoice-editor";
import { computeTotals } from "@/lib/invoice/calculations";
import { formatMoney } from "@/lib/invoice/money";
import { makeId } from "@/lib/invoice/defaults";
import { SignInButton } from "@/components/layout/SignInButton";

type AccountInvoice = {
  id: string;
  invoiceNumber: string;
  title: string | null;
  templateId: string;
  updatedAt: string;
};

type SortKey = "updated" | "number" | "total";

export function MyInvoices({
  signedIn,
  authAvailable,
  userName,
}: {
  signedIn: boolean;
  authAvailable: boolean;
  userName: string | null;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<InvoiceHistoryEntry[]>([]);
  const [account, setAccount] = useState<AccountInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

  /**
   * Read local history (IndexedDB) and, when signed in, account history.
   *
   * `isCurrent` guards every state write: reading history is asynchronous, so a
   * second read triggered before the first resolves (sign-in state changing, a
   * delete refreshing the list) could otherwise land out of order and paint a
   * stale list over a newer one. It also stops a resolved read writing state
   * after the component has unmounted.
   */
  const load = useCallback(
    async (isCurrent: () => boolean) => {
      const entries = await invoiceStore.getAll();
      if (!isCurrent()) return;
      setLocal(entries);

      if (signedIn) {
        try {
          const res = await fetch("/api/invoices");
          if (res.ok) {
            const data = (await res.json()) as { invoices: AccountInvoice[] };
            if (!isCurrent()) return;
            setAccount(data.invoices);
          }
        } catch {
          // Account history is an enhancement; local history still renders.
        }
      }
      if (isCurrent()) setLoading(false);
    },
    [signedIn],
  );

  useEffect(() => {
    let cancelled = false;
    /*
     * `load` only writes state after awaiting IndexedDB (and the network), so
     * nothing is set synchronously here — the lint rule cannot see through the
     * async boundary. Reading from IndexedDB is the "synchronize with an
     * external system" case the rule's own guidance describes, and every write
     * is guarded by the cancellation check above.
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(() => !cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const accountIds = useMemo(() => new Set(account.map((a) => a.id)), [account]);

  const rows = useMemo(() => {
    const filtered = local.filter((entry) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        entry.invoiceNumber.toLowerCase().includes(q) ||
        entry.customerName.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === "number") return a.invoiceNumber.localeCompare(b.invoiceNumber);
      if (sort === "total") return b.total - a.total;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [local, query, sort]);

  async function open(entry: InvoiceHistoryEntry) {
    await openInvoiceInEditor(entry.invoice);
    router.push("/invoice-generator");
  }

  async function duplicate(entry: InvoiceHistoryEntry) {
    const copy = {
      ...entry.invoice,
      id: makeId("inv"),
      invoice: { ...entry.invoice.invoice, number: `${entry.invoice.invoice.number}-COPY` },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await openInvoiceInEditor(copy);
    router.push("/invoice-generator");
  }

  async function remove(entry: InvoiceHistoryEntry) {
    if (!confirm(`Delete invoice ${entry.invoiceNumber}? This cannot be undone.`)) return;
    setLoading(true);
    await invoiceStore.delete(entry.id);
    if (accountIds.has(entry.id)) {
      await fetch(`/api/invoices?id=${encodeURIComponent(entry.id)}`, { method: "DELETE" }).catch(
        () => null,
      );
    }
    void load(() => true);
  }

  async function downloadPdf(entry: InvoiceHistoryEntry) {
    const { renderInvoicePdf, pdfFilename } = await import("@/lib/invoice/pdf");
    const totals = computeTotals(entry.invoice);
    const blob = await renderInvoicePdf(entry.invoice, totals);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfFilename(entry.invoice);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-ink-500">
        <Loader2 className="size-4 animate-spin" /> Loading your invoices…
      </div>
    );
  }

  return (
    <div className="mt-8">
      {authAvailable && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4">
          <div className="flex items-center gap-2 text-[14px] text-ink-700">
            {signedIn ? (
              <>
                <Cloud className="size-4 text-brand-600" />
                Signed in{userName ? ` as ${userName}` : ""} — saved invoices sync to your account.
              </>
            ) : (
              <>
                <HardDrive className="size-4 text-ink-500" />
                These invoices live in this browser only. Sign in to save them to your account.
              </>
            )}
          </div>
          {!signedIn && <SignInButton />}
        </div>
      )}

      {local.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 p-10 text-center">
          <p className="font-medium text-ink-900">No invoices yet</p>
          <p className="mt-1 text-[14px] text-ink-600">
            Invoices appear here once you download or save one.
          </p>
          <Link
            href="/invoice-generator"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Create an invoice
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <Input
                className="pl-9"
                placeholder="Search by invoice number or customer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search invoices"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-48" aria-label="Sort invoices">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Most recently updated</SelectItem>
                <SelectItem value="number">Invoice number</SelectItem>
                <SelectItem value="total">Highest total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
            {rows.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ink-900">{entry.invoiceNumber}</p>
                    {accountIds.has(entry.id) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                        <Cloud className="size-3" /> Saved to account
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-ink-600">
                    {entry.customerName} ·{" "}
                    {new Date(entry.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <p className="font-medium text-ink-900">
                  {formatMoney(entry.total, entry.currency)}
                </p>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => open(entry)} aria-label={`Edit ${entry.invoiceNumber}`}>
                    <Pencil className="text-ink-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicate(entry)} aria-label={`Duplicate ${entry.invoiceNumber}`}>
                    <Copy className="text-ink-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => downloadPdf(entry)} aria-label={`Download ${entry.invoiceNumber}`}>
                    <Download className="text-ink-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(entry)} aria-label={`Delete ${entry.invoiceNumber}`}>
                    <Trash2 className="text-ink-400" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {rows.length === 0 && (
            <p className="mt-4 text-center text-[14px] text-ink-500">
              No invoices match &ldquo;{query}&rdquo;.
            </p>
          )}
        </>
      )}
    </div>
  );
}
