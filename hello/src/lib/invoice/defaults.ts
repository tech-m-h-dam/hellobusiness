/**
 * Factories that build a blank invoice and its parts.
 *
 * Centralised here so the editor, "new invoice" flow, template switch and tests
 * all start from one definition of "empty" — adding a new field to the model
 * means updating one factory, not every call site that constructs an invoice.
 */
import type {
  Charge,
  ColumnKey,
  CustomField,
  Discount,
  Invoice,
  InvoiceItem,
  ItemImageSettings,
  QrSettings,
  Signature,
  Tax,
} from "./types";

/** Short, collision-resistant id for client-only objects (line items, taxes, …). */
export function makeId(prefix = "id"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Sequential invoice number seed, e.g. INV-1001. Callers may override freely. */
export function defaultInvoiceNumber(): string {
  return `INV-${1000 + Math.floor(Math.random() * 9000)}`;
}

export function defaultImageSettings(): ItemImageSettings {
  return {
    layout: "thumbnail",
    width: 56,
    height: 56,
    fit: "cover",
    align: "left",
    radius: 6,
    border: true,
    gap: 8,
  };
}

export function createLineItem(overrides: Partial<InvoiceItem> = {}): InvoiceItem {
  return {
    id: makeId("item"),
    name: "",
    description: "",
    sku: "",
    hsn: "",
    quantity: 1,
    unit: "",
    rate: 0,
    discountValue: 0,
    discountType: "percentage",
    taxIds: [],
    images: [],
    imageSettings: defaultImageSettings(),
    ...overrides,
  };
}

export function createTax(overrides: Partial<Tax> = {}): Tax {
  return {
    id: makeId("tax"),
    name: "Tax",
    rate: 0,
    mode: "percentage",
    inclusive: false,
    ...overrides,
  };
}

export function createDiscount(overrides: Partial<Discount> = {}): Discount {
  return { id: makeId("disc"), label: "Discount", value: 0, type: "percentage", ...overrides };
}

export function createCharge(overrides: Partial<Charge> = {}): Charge {
  return {
    id: makeId("charge"),
    label: "Shipping",
    value: 0,
    type: "fixed",
    taxable: false,
    taxIds: [],
    ...overrides,
  };
}

export function createCustomField(overrides: Partial<CustomField> = {}): CustomField {
  return {
    id: makeId("field"),
    label: "",
    value: "",
    visible: true,
    section: "invoice",
    ...overrides,
  };
}

export function defaultQrSettings(): QrSettings {
  return { enabled: false, source: "upi", size: 96, caption: "Scan to pay" };
}

export function defaultSignature(): Signature {
  return { width: 160, align: "right" };
}

const ALL_COLUMNS: ColumnKey[] = [
  "index", "image", "name", "description", "sku", "hsn",
  "quantity", "unit", "rate", "discount", "tax", "amount",
];

export function defaultColumnVisibility(): Record<ColumnKey, boolean> {
  return ALL_COLUMNS.reduce(
    (acc, key) => {
      acc[key] = !["sku", "hsn", "image", "discount"].includes(key);
      return acc;
    },
    {} as Record<ColumnKey, boolean>,
  );
}

export function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const now = new Date().toISOString();
  return {
    id: makeId("inv"),
    business: { name: "" },
    customer: { name: "" },
    invoice: {
      number: defaultInvoiceNumber(),
      date: todayIso(),
      dueDate: addDaysIso(15),
      documentTitle: "Invoice",
      currency: "USD",
      locale: "en-US",
      paymentTerms: "Due within 15 days",
      status: "draft",
    },
    items: [createLineItem()],
    taxes: [],
    discounts: [],
    charges: [],
    payment: {},
    qr: defaultQrSettings(),
    notes: "Thank you for your business.",
    terms: "",
    signature: defaultSignature(),
    customFields: [],
    settings: {
      pageSize: "A4",
      orientation: "portrait",
      margin: 40,
      primaryColor: "#2563eb",
      secondaryColor: "#0f172a",
      accentTextColor: "#ffffff",
      logoPosition: "left",
      logoSize: 96,
      fontFamily: "Helvetica",
      baseFontSize: 10,
      headingFontSize: 22,
      tableFontSize: 9.5,
      footerFontSize: 8.5,
      tableStyle: "bordered",
      columnWidths: {},
      showColumn: defaultColumnVisibility(),
      showNotes: true,
      showTerms: false,
      showSignature: false,
      showPaymentDetails: true,
      showBankDetails: false,
      showQr: false,
      showShipping: false,
      showPageNumbers: true,
      showFooter: true,
      showDueDate: true,
      showTaxSummary: true,
      decimals: 2,
      roundTotal: false,
      dateFormat: "d MMM yyyy",
    },
    templateId: "minimal",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Common tax presets offered in the tax picker; entirely data, not logic. */
export const TAX_PRESETS: { label: string; taxes: Omit<Tax, "id">[] }[] = [
  {
    label: "GST 18% (India, single rate)",
    taxes: [{ name: "GST", rate: 18, mode: "percentage", inclusive: false }],
  },
  {
    label: "GST 18% split — CGST 9% + SGST 9%",
    taxes: [
      { name: "CGST", rate: 9, mode: "percentage", inclusive: false },
      { name: "SGST", rate: 9, mode: "percentage", inclusive: false },
    ],
  },
  {
    label: "IGST 18% (India, interstate)",
    taxes: [{ name: "IGST", rate: 18, mode: "percentage", inclusive: false }],
  },
  {
    label: "VAT 20%",
    taxes: [{ name: "VAT", rate: 20, mode: "percentage", inclusive: false }],
  },
  {
    label: "Sales Tax 7.25%",
    taxes: [{ name: "Sales Tax", rate: 7.25, mode: "percentage", inclusive: false }],
  },
  {
    label: "No tax",
    taxes: [],
  },
];

export const CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED", "JPY", "CNY", "ZAR", "NZD",
] as const;
