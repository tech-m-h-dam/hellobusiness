/**
 * Zod schemas mirroring `types.ts`.
 *
 * Used to validate: (a) form input at the edges of the editor, (b) data coming
 * back out of localStorage/IndexedDB (which may have been written by an older
 * app version, hand-edited, or corrupted), and (c) the JSON payload accepted by
 * the optional `/api/invoices` save endpoint. Never trust client-side validation
 * alone — the API route re-validates with this same schema server-side.
 */
import { z } from "zod";

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required`);
const optionalText = (max = 500) => z.string().max(max).optional().or(z.literal(""));

export const businessDetailsSchema = z.object({
  name: z.string().max(200).default(""),
  logo: z.string().optional(),
  logoWidth: z.number().min(20).max(400).optional(),
  addressLine1: optionalText(),
  addressLine2: optionalText(),
  city: optionalText(120),
  state: optionalText(120),
  postalCode: optionalText(30),
  country: optionalText(120),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: optionalText(40),
  website: optionalText(200),
  taxId: optionalText(60),
  gstin: optionalText(30),
});

export const customerDetailsSchema = z.object({
  name: z.string().max(200).default(""),
  company: optionalText(200),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: optionalText(40),
  billingAddress: optionalText(1000),
  shippingAddress: optionalText(1000),
  shipToDifferentAddress: z.boolean().optional(),
  gstin: optionalText(30),
  taxId: optionalText(60),
});

export const invoiceMetaSchema = z.object({
  number: nonEmpty("Invoice number").max(60),
  date: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional().or(z.literal("")),
  documentTitle: z.string().max(80).default("Invoice"),
  purchaseOrder: optionalText(80),
  reference: optionalText(80),
  currency: z.string().length(3, "Use a 3-letter ISO currency code"),
  locale: z.string().min(2).max(20),
  paymentTerms: optionalText(200),
  status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
});

const imageFitSchema = z.enum(["cover", "contain", "fill"]);
const imageAlignSchema = z.enum(["left", "center", "right"]);

export const itemImageSchema = z.object({
  id: z.string(),
  src: z.string().min(1),
  thumb: z.string().optional(),
  alt: z.string().max(200).optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  bytes: z.number().nonnegative().optional(),
});

export const itemImageSettingsSchema = z.object({
  layout: z.enum(["thumbnail", "large", "gallery", "productCard", "custom"]),
  width: z.number().min(8).max(600),
  height: z.number().min(8).max(600),
  fit: imageFitSchema,
  align: imageAlignSchema,
  radius: z.number().min(0).max(100),
  border: z.boolean(),
  gap: z.number().min(0).max(60),
});

const discountTypeSchema = z.enum(["percentage", "fixed"]);

export const invoiceItemSchema = z.object({
  id: z.string(),
  name: z.string().max(300).default(""),
  description: optionalText(2000),
  sku: optionalText(80),
  hsn: optionalText(20),
  quantity: z.number().finite(),
  unit: optionalText(30),
  rate: z.number().finite(),
  discountValue: z.number().finite().default(0),
  discountType: discountTypeSchema.default("percentage"),
  taxIds: z.array(z.string()).default([]),
  /** Per-line rate overrides keyed by tax id (e.g. mixed GST slabs). */
  taxRates: z.record(z.string(), z.number().finite()).optional(),
  images: z.array(itemImageSchema).max(20, "Up to 20 images per item").default([]),
  imageSettings: itemImageSettingsSchema,
});

export const taxSchema = z.object({
  id: z.string(),
  name: z.string().max(60).default(""),
  rate: z.number().finite(),
  mode: z.enum(["percentage", "fixed"]),
  inclusive: z.boolean(),
  description: optionalText(200),
});

export const discountSchema = z.object({
  id: z.string(),
  label: z.string().max(80).default(""),
  value: z.number().finite(),
  type: discountTypeSchema,
});

export const chargeSchema = z.object({
  id: z.string(),
  label: z.string().max(80).default(""),
  value: z.number().finite(),
  type: discountTypeSchema,
  taxable: z.boolean(),
  taxIds: z.array(z.string()).default([]),
});

export const paymentDetailsSchema = z.object({
  bankName: optionalText(120),
  accountName: optionalText(120),
  accountNumber: optionalText(60),
  ifsc: optionalText(20),
  swift: optionalText(20),
  iban: optionalText(40),
  routingNumber: optionalText(20),
  upiId: optionalText(80),
  paymentLink: optionalText(300),
  instructions: optionalText(1000),
});

export const transportDetailsSchema = z.object({
  eWayBillNumber: optionalText(40),
  eWayBillDate: optionalText(30),
  transporterName: optionalText(120),
  transporterId: optionalText(40),
  vehicleNumber: optionalText(30),
  modeOfTransport: optionalText(40),
  placeOfSupply: optionalText(120),
  dispatchFrom: optionalText(200),
});

export const qrSettingsSchema = z.object({
  enabled: z.boolean(),
  source: z.enum(["upi", "link", "custom"]),
  customValue: optionalText(500),
  size: z.number().min(40).max(300),
  caption: optionalText(80),
});

export const signatureSchema = z.object({
  src: z.string().optional(),
  name: optionalText(120),
  label: optionalText(60),
  width: z.number().min(40).max(400),
  align: imageAlignSchema,
});

export const customFieldSchema = z.object({
  id: z.string(),
  label: z.string().max(80).default(""),
  value: z.string().max(500).default(""),
  visible: z.boolean(),
  section: z.enum(["invoice", "business", "customer", "footer"]),
});

const columnKeySchema = z.enum([
  "index", "image", "name", "description", "sku", "hsn",
  "quantity", "unit", "rate", "discount", "tax", "amount",
]);

export const invoiceSettingsSchema = z.object({
  pageSize: z.enum(["A4", "Letter"]),
  orientation: z.enum(["portrait", "landscape"]),
  margin: z.number().min(0).max(80),
  primaryColor: z.string().max(20),
  secondaryColor: z.string().max(20),
  accentTextColor: z.string().max(20),
  logoPosition: z.enum(["left", "right", "center"]),
  logoSize: z.number().min(20).max(400),
  fontFamily: z.enum(["Helvetica", "Times-Roman", "Courier"]),
  baseFontSize: z.number().min(6).max(24),
  headingFontSize: z.number().min(8).max(40),
  tableFontSize: z.number().min(6).max(20),
  footerFontSize: z.number().min(5).max(18),
  tableStyle: z.enum(["bordered", "striped", "minimal"]),
  columnWidths: z.partialRecord(columnKeySchema, z.number()).default({}),
  showColumn: z.record(columnKeySchema, z.boolean()),
  showNotes: z.boolean(),
  showTerms: z.boolean(),
  showSignature: z.boolean(),
  showPaymentDetails: z.boolean(),
  showBankDetails: z.boolean(),
  showQr: z.boolean(),
  showShipping: z.boolean(),
  showTransport: z.boolean(),
  showPageNumbers: z.boolean(),
  showFooter: z.boolean(),
  showDueDate: z.boolean(),
  showTaxSummary: z.boolean(),
  decimals: z.number().min(0).max(4),
  roundTotal: z.boolean(),
  dateFormat: z.enum(["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "d MMM yyyy"]),
});

/** Sparse label overrides; unknown keys are stripped rather than rejected. */
const labelsSchema = z.record(z.string(), z.string().max(60)).optional();

export const invoiceSchema = z.object({
  id: z.string(),
  labels: labelsSchema,
  business: businessDetailsSchema,
  customer: customerDetailsSchema,
  invoice: invoiceMetaSchema,
  items: z.array(invoiceItemSchema).max(500, "Up to 500 line items"),
  taxes: z.array(taxSchema).max(30),
  discounts: z.array(discountSchema).max(10),
  charges: z.array(chargeSchema).max(10),
  payment: paymentDetailsSchema,
  transport: transportDetailsSchema.optional(),
  qr: qrSettingsSchema,
  notes: optionalText(4000),
  terms: optionalText(4000),
  signature: signatureSchema,
  customFields: z.array(customFieldSchema).max(20),
  settings: invoiceSettingsSchema,
  templateId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

/** Image upload constraints — defined in ./limits so browser code can read them
 * without pulling Zod into the client bundle. Re-exported here for callers that
 * already import from this module. */
export { IMAGE_UPLOAD_LIMITS } from "./limits";

export function validateInvoice(data: unknown) {
  return invoiceSchema.safeParse(data);
}
