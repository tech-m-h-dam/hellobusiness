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
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    void draftStore.save(invoice).then(onSaved);
  }, 800);
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

/** Start a brand new invoice, carrying over the saved business profile if any. */
export function newInvoiceFrom(business?: Invoice["business"]): Invoice {
  return createInvoice(business ? { business, id: makeId("inv") } : { id: makeId("inv") });
}
