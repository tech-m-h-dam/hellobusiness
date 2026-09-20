/**
 * Editable document labels.
 *
 * Every piece of fixed wording printed on an invoice — "Bill To", the column
 * headers, "Subtotal", "Total", "Notes" — is a label the user can rename. This
 * matters for more than taste: businesses invoicing in another language, or in
 * a sector with its own vocabulary ("Patient", "Job No.", "Consignee",
 * "Taxable Value"), otherwise hit a wall the moment the built-in English
 * wording doesn't fit.
 *
 * Labels are stored as a sparse override map on the invoice: only the ones the
 * user actually changed are persisted, so the defaults can be improved later
 * without rewriting anyone's saved invoices, and a missing key always falls
 * back rather than rendering blank.
 */
import type { Invoice } from "./types";

export const DEFAULT_LABELS = {
  // Parties
  billTo: "Bill To",
  shipTo: "Ship To",
  from: "From",

  // Invoice meta
  invoiceNumber: "Invoice #",
  invoiceDate: "Date",
  dueDate: "Due Date",
  poNumber: "PO #",
  reference: "Reference",
  paymentTerms: "Payment Terms",

  // Table columns
  index: "#",
  image: "",
  name: "Item",
  description: "Description",
  sku: "SKU",
  hsn: "HSN/SAC",
  quantity: "Qty",
  unit: "Unit",
  rate: "Rate",
  discount: "Discount",
  tax: "Tax",
  amount: "Amount",

  // Totals
  subtotal: "Subtotal",
  itemDiscounts: "Item discounts",
  taxableValue: "Taxable Value",
  charges: "Charges",
  rounding: "Rounding",
  total: "Total",
  amountInWords: "Amount in words",
  balanceDue: "Balance Due",

  // Transport / E-Way Bill
  transportDetails: "E-Way Bill & Transport",
  eWayBillNumber: "E-Way Bill No.",
  eWayBillDate: "E-Way Bill Date",
  transporterName: "Transporter",
  transporterId: "Transporter ID",
  vehicleNumber: "Vehicle No.",
  modeOfTransport: "Mode of Transport",
  placeOfSupply: "Place of Supply",
  dispatchFrom: "Dispatched From",

  // Footer blocks
  notes: "Notes",
  terms: "Terms & Conditions",
  paymentDetails: "Payment Details",
  authorizedSignature: "Authorized Signature",
} as const;

export type LabelKey = keyof typeof DEFAULT_LABELS;

/** Sparse overrides — only what the user changed. */
export type InvoiceLabels = Partial<Record<LabelKey, string>>;

export const LABEL_KEYS = Object.keys(DEFAULT_LABELS) as LabelKey[];

/**
 * Groupings for the label editor UI, so the user sees a manageable list
 * rather than forty inputs in one column.
 */
export const LABEL_GROUPS: { title: string; keys: LabelKey[] }[] = [
  { title: "Parties", keys: ["billTo", "shipTo", "from"] },
  {
    title: "Invoice details",
    keys: ["invoiceNumber", "invoiceDate", "dueDate", "poNumber", "reference", "paymentTerms"],
  },
  {
    title: "Table columns",
    keys: ["index", "name", "description", "sku", "hsn", "quantity", "unit", "rate", "discount", "tax", "amount"],
  },
  {
    title: "Totals",
    keys: ["subtotal", "itemDiscounts", "taxableValue", "charges", "rounding", "total", "amountInWords", "balanceDue"],
  },
  {
    title: "E-Way Bill & transport",
    keys: [
      "transportDetails", "eWayBillNumber", "eWayBillDate", "transporterName",
      "transporterId", "vehicleNumber", "modeOfTransport", "placeOfSupply", "dispatchFrom",
    ],
  },
  { title: "Footer", keys: ["notes", "terms", "paymentDetails", "authorizedSignature"] },
];

/**
 * The label to print for `key` on this invoice.
 *
 * An override of "" is meaningful — it means the user deliberately blanked a
 * header — so we only fall back when the key is genuinely absent, not when it
 * is an empty string.
 */
export function labelFor(invoice: Pick<Invoice, "labels">, key: LabelKey): string {
  const override = invoice.labels?.[key];
  return override !== undefined ? override : DEFAULT_LABELS[key];
}

/** Drop overrides that match the default, so we never persist redundant data. */
export function pruneLabels(labels: InvoiceLabels): InvoiceLabels {
  const out: InvoiceLabels = {};
  for (const key of LABEL_KEYS) {
    const value = labels[key];
    if (value !== undefined && value !== DEFAULT_LABELS[key]) out[key] = value;
  }
  return out;
}
