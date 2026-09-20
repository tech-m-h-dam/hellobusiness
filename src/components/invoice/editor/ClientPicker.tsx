"use client";

/**
 * Saved clients.
 *
 * Repeat customers are the normal case for anyone invoicing regularly, and
 * re-typing an address every month is the main reason people keep a previous
 * invoice open just to copy from it. Clients are stored in IndexedDB like
 * everything else anonymous, so this works with no account.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { type SavedCustomer, customerStore } from "@/lib/invoice/storage";
import { makeId } from "@/lib/invoice/defaults";

export function ClientPicker() {
  const customer = useInvoiceEditor((s) => s.invoice.customer);
  const update = useInvoiceEditor((s) => s.update);
  const [clients, setClients] = useState<SavedCustomer[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    setClients(await customerStore.getAll());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void customerStore.getAll().then((all) => {
      if (!cancelled) setClients(all);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Save the customer currently on the invoice as a reusable client. */
  async function saveCurrent() {
    const name = customer.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      // Update in place when a client with the same name already exists, so
      // saving twice corrects the record rather than duplicating it.
      const existing = clients.find(
        (c) => c.name.trim().toLowerCase() === name.toLowerCase(),
      );
      const id = existing?.id ?? makeId("cust");
      await customerStore.put(id, { ...customer, id });
      await load();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function apply(client: SavedCustomer) {
    update((inv) => ({
      ...inv,
      // `id` belongs to the saved record, not to the invoice's customer block.
      customer: { ...client, id: undefined } as typeof inv.customer,
    }));
  }

  async function remove(client: SavedCustomer) {
    if (!confirm(`Remove ${client.name} from your saved clients?`)) return;
    await customerStore.delete(client.id);
    await load();
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="secondary" size="sm">
            <Users />
            Saved clients{clients.length > 0 ? ` (${clients.length})` : ""}
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
          <DropdownMenuLabel>Pick a client</DropdownMenuLabel>
          {clients.length === 0 ? (
            <p className="px-2 py-3 text-[13px] text-ink-500">
              No saved clients yet. Fill in the customer below and choose{" "}
              <span className="font-medium">Save client</span>.
            </p>
          ) : (
            <>
              <DropdownMenuSeparator />
              {clients.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onSelect={() => apply(client)}
                  className="flex items-start justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-900">{client.name}</span>
                    {(client.company || client.email) && (
                      <span className="block truncate text-[12px] text-ink-500">
                        {client.company || client.email}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${client.name}`}
                    onClick={(e) => {
                      // Keep the menu open: removing is a side action, not a pick.
                      e.preventDefault();
                      e.stopPropagation();
                      void remove(client);
                    }}
                    className="shrink-0 rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={saveCurrent}
        disabled={saving || !customer.name.trim()}
      >
        {saving ? <Loader2 className="animate-spin" /> : justSaved ? <Check /> : <UserPlus />}
        {justSaved ? "Saved" : "Save client"}
      </Button>
    </div>
  );
}
