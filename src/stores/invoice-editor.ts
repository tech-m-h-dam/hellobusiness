"use client";

/**
 * The invoice editor's client state.
 *
 * One Zustand store holds the `Invoice` currently being edited. Every mutation
 * goes through `update()`, which also (a) bumps `updatedAt` and (b) schedules a
 * debounced write to IndexedDB (`draftStore`) — so a page reload, tab close or
 * crash never loses more than ~800ms of edits, without writing to disk on
 * every keystroke. This is the sole "autosave" mechanism; there is no server
 * round-trip anywhere in this path (spec sections 18, 50).
 */
import { create } from "zustand";
import { createInvoice, makeId } from "@/lib/invoice/defaults";
import { draftStore, saveInvoiceToHistory } from "@/lib/invoice/storage";
import { computeTotals } from "@/lib/invoice/calculations";
import type { ComputedTotals, Invoice } from "@/lib/invoice/types";

type Recipe<T> = T | ((current: T) => T);

function resolve<T>(recipe: Recipe<T>, current: T): T {
  return typeof recipe === "function" ? (recipe as (c: T) => T)(current) : recipe;
}

type InvoiceEditorState = {
  invoice: Invoice;
  totals: ComputedTotals;
  hydrated: boolean;
  saving: boolean;
  lastSavedAt: string | null;

  /** Replace the whole invoice (loading a draft, opening a saved one, "new invoice"). */
  load: (invoice: Invoice) => void;
  /** Patch any top-level section immutably; recomputes totals and schedules autosave. */
  update: (recipe: Recipe<Invoice>) => void;
  reset: () => void;

  hydrateFromDraft: () => Promise<void>;
  saveToHistory: () => Promise<void>;
};

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(invoice: Invoice, onSaved: () => void) {
  cancelAutosave();
  autosaveTimer = setTimeout(() => {
    void draftStore.save(invoice).then(onSaved);
  }, 800);
}

function cancelAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = null;
}

export const useInvoiceEditor = create<InvoiceEditorState>((set, get) => ({
  invoice: createInvoice(),
  totals: computeTotals(createInvoice()),
  hydrated: false,
  saving: false,
  lastSavedAt: null,

  load: (invoice) => {
    set({ invoice, totals: computeTotals(invoice) });
  },

  update: (recipe) => {
    const current = get().invoice;
    const next = { ...resolve(recipe, current), updatedAt: new Date().toISOString() };
    set({ invoice: next, totals: computeTotals(next), saving: true });
    scheduleAutosave(next, () => set({ saving: false, lastSavedAt: new Date().toISOString() }));
  },

  reset: () => {
    const fresh = createInvoice();
    set({ invoice: fresh, totals: computeTotals(fresh) });
    void draftStore.clear();
  },

  hydrateFromDraft: async () => {
    if (get().hydrated) return;
    try {
      const saved = await draftStore.get();
      if (saved) set({ invoice: saved, totals: computeTotals(saved) });
    } finally {
      set({ hydrated: true });
    }
  },

  saveToHistory: async () => {
    const { invoice, totals } = get();
    await saveInvoiceToHistory(invoice, totals);
  },
}));

/**
 * Load an invoice into the editor from somewhere else in the app — "use this
 * format", "use this template", opening or duplicating a saved invoice.
 *
 * Writing the draft to IndexedDB is not enough on its own. This store is a
 * module singleton that outlives client-side navigation, so once any page has
 * mounted the editor, `hydrated` stays true and `hydrateFromDraft()` returns
 * early without re-reading the draft — the newly saved invoice would be on
 * disk but the editor would still be showing the old one. So the store is
 * updated directly as well, which also covers the case where the editor is
 * already mounted on the current page.
 *
 * A pending autosave of the *previous* invoice is cancelled first: it would
 * otherwise fire a few hundred milliseconds later and overwrite the draft that
 * was just chosen.
 */
export async function openInvoiceInEditor(invoice: Invoice): Promise<void> {
  cancelAutosave();
  await draftStore.save(invoice);
  useInvoiceEditor.setState({
    invoice,
    totals: computeTotals(invoice),
    hydrated: true,
    saving: false,
    lastSavedAt: new Date().toISOString(),
  });
}

/** Start a brand new invoice, carrying over the saved business profile if any. */
export function newInvoiceFrom(business?: Invoice["business"]): Invoice {
  return createInvoice(business ? { business, id: makeId("inv") } : { id: makeId("inv") });
}
