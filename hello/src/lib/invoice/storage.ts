/**
 * Anonymous-user persistence: IndexedDB.
 *
 * Everything a browser-only user creates — invoices, business profile,
 * customers, product catalogue, custom templates — lives here, not on any
 * server. IndexedDB (not localStorage) because invoices carry data-URL images
 * that can run into several MB, well past localStorage's ~5-10MB *synchronous*
 * quota; IndexedDB's quota is disk-relative (typically hundreds of MB+) and its
 * API is async, so large writes never block the UI thread.
 *
 * `schemaVersion` is stored on every record. `migrations` below is keyed by the
 * version a record was written at, and each migration bumps it by exactly one
 * step; `migrate()` walks a record forward to `CURRENT_SCHEMA_VERSION` on read.
 * This is what lets the on-disk shape change across app versions without a
 * blanket "wipe and start over" — see spec section 59.
 */
import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Invoice } from "./types";

export const CURRENT_SCHEMA_VERSION = 1;

export type StoredRecord<T> = {
  schemaVersion: number;
  id: string;
  updatedAt: string;
  data: T;
};

export type BusinessProfile = Invoice["business"] & {
  id: string;
  label: string;
  isDefault?: boolean;
};

export type SavedCustomer = Invoice["customer"] & { id: string };

export type SavedProduct = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  hsn?: string;
  rate: number;
  unit?: string;
  taxIds: string[];
};

export type CustomTemplate = {
  id: string;
  name: string;
  baseTemplateId: string;
  settings: Invoice["settings"];
  /** Renamed document wording, saved alongside the styling. */
  labels: NonNullable<Invoice["labels"]>;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceHistoryEntry = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  currency: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  invoice: Invoice;
};

interface AppDB extends DBSchema {
  invoices: { key: string; value: StoredRecord<InvoiceHistoryEntry>; indexes: { updatedAt: string } };
  businessProfiles: { key: string; value: StoredRecord<BusinessProfile> };
  customers: { key: string; value: StoredRecord<SavedCustomer> };
  products: { key: string; value: StoredRecord<SavedProduct> };
  templates: { key: string; value: StoredRecord<CustomTemplate> };
  /** Single-row store: the invoice currently open in the editor (autosave target). */
  draft: { key: string; value: StoredRecord<Invoice> };
}

const DB_NAME = "invoice-generator";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("invoices")) {
          const store = db.createObjectStore("invoices", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains("businessProfiles")) {
          db.createObjectStore("businessProfiles", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("customers")) {
          db.createObjectStore("customers", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("products")) {
          db.createObjectStore("products", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("templates")) {
          db.createObjectStore("templates", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("draft")) {
          db.createObjectStore("draft", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Per-record migrations. `migrations[v]` transforms a record written at schema
 * version `v` into version `v + 1`. There is nothing to migrate yet — this
 * exists so the *first* real migration is additive, not a refactor.
 */
const migrations: Record<number, (data: unknown) => unknown> = {
  // 1: (data) => ({ ...data as object, someNewField: defaultValue }),
};

function migrate<T>(record: StoredRecord<T>): StoredRecord<T> {
  let { schemaVersion } = record;
  let current: unknown = record.data;
  while (schemaVersion < CURRENT_SCHEMA_VERSION) {
    const step = migrations[schemaVersion];
    if (!step) break; // no migration registered — keep data as-is rather than throw
    current = step(current);
    schemaVersion += 1;
  }
  return { ...record, schemaVersion, data: current as T };
}

function wrap<T>(id: string, data: T): StoredRecord<T> {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id,
    updatedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Generic CRUD over a store, with migration-on-read and corruption tolerance.
 *
 * `idb`'s per-store method overloads resolve against literal store-name types;
 * a store name threaded through this function's own generic parameter is, as
 * far as those overloads are concerned, just `string`, so TS can't pick a
 * matching overload. We know the mapping is correct by construction (each
 * exported store below is created with one specific, matching `Name`/`T`
 * pair), so the `idb` handle is treated as untyped at this one boundary; every
 * call site outside this function still goes through the fully-typed
 * `StoreApi<T>` this factory returns.
 */
type StoreApi<T> = {
  getAll(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  put(id: string, data: T): Promise<void>;
  delete(id: string): Promise<void>;
};

function makeStore<Name extends keyof AppDB, T>(name: Name): StoreApi<T> {
  return {
    async getAll() {
      try {
        const db = (await getDb()) as unknown as { getAll: (n: string) => Promise<StoredRecord<T>[]> };
        const all = await db.getAll(name as string);
        return all.map((r) => migrate(r).data);
      } catch {
        // Corrupted DB, private-browsing quota block, etc: fail soft to empty.
        return [];
      }
    },
    async get(id: string) {
      try {
        const db = (await getDb()) as unknown as {
          get: (n: string, id: string) => Promise<StoredRecord<T> | undefined>;
        };
        const record = await db.get(name as string, id);
        return record ? migrate(record).data : undefined;
      } catch {
        return undefined;
      }
    },
    async put(id: string, data: T) {
      try {
        const db = (await getDb()) as unknown as {
          put: (n: string, value: StoredRecord<T>) => Promise<string>;
        };
        await db.put(name as string, wrap(id, data));
      } catch (err) {
        console.error(`[storage] failed to save to ${String(name)}`, err);
        throw err;
      }
    },
    async delete(id: string) {
      try {
        const db = (await getDb()) as unknown as { delete: (n: string, id: string) => Promise<void> };
        await db.delete(name as string, id);
      } catch {
        /* deleting a record that failed to save in the first place is a no-op */
      }
    },
  };
}

export const invoiceStore = makeStore<"invoices", InvoiceHistoryEntry>("invoices");
export const businessProfileStore = makeStore<"businessProfiles", BusinessProfile>(
  "businessProfiles",
);
export const customerStore = makeStore<"customers", SavedCustomer>("customers");
export const productStore = makeStore<"products", SavedProduct>("products");
export const templateStore = makeStore<"templates", CustomTemplate>("templates");

const DRAFT_KEY = "current";

/** The editor's autosave slot: whatever invoice is open right now. */
export const draftStore = {
  async get(): Promise<Invoice | undefined> {
    try {
      const db = await getDb();
      const record = await db.get("draft", DRAFT_KEY);
      return record ? migrate(record).data : undefined;
    } catch {
      return undefined;
    }
  },
  async save(invoice: Invoice): Promise<void> {
    try {
      const db = await getDb();
      await db.put("draft", wrap(DRAFT_KEY, invoice));
    } catch (err) {
      console.error("[storage] failed to autosave draft", err);
    }
  },
  async clear(): Promise<void> {
    try {
      const db = await getDb();
      await db.delete("draft", DRAFT_KEY);
    } catch {
      /* no-op */
    }
  },
};

/** Save (or update) an invoice into local history, keyed by the invoice's own id. */
export async function saveInvoiceToHistory(invoice: Invoice, totals: { total: number }) {
  const entry: InvoiceHistoryEntry = {
    id: invoice.id,
    invoiceNumber: invoice.invoice.number,
    customerName: invoice.customer.name || "Untitled customer",
    total: totals.total,
    currency: invoice.invoice.currency,
    templateId: invoice.templateId,
    createdAt: invoice.createdAt,
    updatedAt: new Date().toISOString(),
    invoice,
  };
  await invoiceStore.put(invoice.id, entry);
  return entry;
}

/** Rough estimate of IndexedDB usage, for a storage-budget indicator in the UI. */
export async function estimateStorageUsage(): Promise<{ usageBytes: number; quotaBytes: number } | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return { usageBytes: usage ?? 0, quotaBytes: quota ?? 0 };
  } catch {
    return null;
  }
}
