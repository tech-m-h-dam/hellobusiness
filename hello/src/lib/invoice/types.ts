/**
 * The normalised invoice data model.
 *
 * Every template, the preview renderer, the PDF renderer, local storage and the
 * optional account save all consume this one shape. Templates are pure
 * presentation over it, which is what makes template switching non-destructive:
 * no template owns any data.
 */

/* -------------------------------------------------------------------------- */
/* Parties                                                                     */
/* -------------------------------------------------------------------------- */

export type BusinessDetails = {
  name: string;
  /** Data URL. Stays in the browser for anonymous users. */
  logo?: string;
  logoWidth?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  gstin?: string;
};

export type CustomerDetails = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  /** When false the shipping block is hidden even if an address is present. */
  shipToDifferentAddress?: boolean;
  gstin?: string;
  taxId?: string;
};

/* -------------------------------------------------------------------------- */
/* Invoice meta                                                                */
/* -------------------------------------------------------------------------- */

export type InvoiceMeta = {
  number: string;
  /** ISO date string (yyyy-mm-dd). Kept as a string so it round-trips through JSON. */
  date: string;
  dueDate?: string;
  /** Free-form label, e.g. "Tax Invoice", "Proforma Invoice". */
  documentTitle: string;
  purchaseOrder?: string;
  reference?: string;
  currency: string;
  /** BCP-47 tag driving number, date and currency formatting. */
  locale: string;
  paymentTerms?: string;
  status?: "draft" | "sent" | "paid" | "overdue";
};

/* -------------------------------------------------------------------------- */
/* Line items                                                                  */
/* -------------------------------------------------------------------------- */

export type ImageFit = "cover" | "contain" | "fill";
export type ImageAlign = "left" | "center" | "right";

/** An image attached to a line item. Held as a data URL; never uploaded. */
export type ItemImage = {
  id: string;
  /** Data URL of the processed (resized + compressed) image. */
  src: string;
  /** Small data URL used in the editor list so the big one is not re-decoded. */
  thumb?: string;
  alt?: string;
  width: number;
  height: number;
  /** Bytes after client-side compression, for the storage budget indicator. */
  bytes?: number;
};

export type ItemImageLayout = "thumbnail" | "large" | "gallery" | "productCard" | "custom";

export type ItemImageSettings = {
  layout: ItemImageLayout;
  /** Render width in points (1pt = 1/72in) so preview and PDF agree. */
  width: number;
  height: number;
  fit: ImageFit;
  align: ImageAlign;
  radius: number;
  border: boolean;
  gap: number;
};

export type DiscountType = "percentage" | "fixed";

export type InvoiceItem = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  /** HSN (goods) / SAC (services) code, used on Indian GST invoices. */
  hsn?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discountValue: number;
  discountType: DiscountType;
  /**
   * Ids of the taxes (from `Invoice.taxes`) that apply to this line. An empty
   * array means the line is not taxed.
   */
  taxIds: string[];
  images: ItemImage[];
  imageSettings: ItemImageSettings;
};

/* -------------------------------------------------------------------------- */
/* Taxes, discounts, charges                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A tax definition. Deliberately data-driven: nothing in the UI or the engine
 * knows what "GST" or "VAT" means, it only knows rates and modes. Jurisdiction
 * rules change; this shape does not have to.
 */
export type Tax = {
  id: string;
  /** Display label, e.g. "CGST", "VAT", "Sales Tax". */
  name: string;
  /** Percentage rate when `mode` is "percentage". */
  rate: number;
  mode: "percentage" | "fixed";
  /** true = rate is already contained in the item rate. */
  inclusive: boolean;
  /** Shown in a compound tax summary, e.g. GSTIN-style CGST/SGST splits. */
  description?: string;
};

export type Discount = {
  id: string;
  label: string;
  value: number;
  type: DiscountType;
};

export type Charge = {
  id: string;
  label: string;
  value: number;
  type: DiscountType;
  /** Whether invoice taxes apply to this charge (shipping is often taxable). */
  taxable: boolean;
  taxIds: string[];
};

/* -------------------------------------------------------------------------- */
/* Payment, signature, custom fields                                           */
/* -------------------------------------------------------------------------- */

export type PaymentDetails = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  swift?: string;
  iban?: string;
  routingNumber?: string;
  upiId?: string;
  paymentLink?: string;
  instructions?: string;
};

export type QrSettings = {
  enabled: boolean;
  /** upi = built from payment.upiId + total; link = paymentLink; custom = free text. */
  source: "upi" | "link" | "custom";
  customValue?: string;
  size: number;
  caption?: string;
};

export type Signature = {
  /** Data URL of the drawn or uploaded signature. */
  src?: string;
  name?: string;
  label?: string;
  width: number;
  align: ImageAlign;
};

export type CustomField = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  /** Where the field is rendered on the document. */
  section: "invoice" | "business" | "customer" | "footer";
};

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export type ColumnKey =
  | "index"
  | "image"
  | "name"
  | "description"
  | "sku"
  | "hsn"
  | "quantity"
  | "unit"
  | "rate"
  | "discount"
  | "tax"
  | "amount";

export type InvoiceSettings = {
  /** Page */
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  margin: number;

  /** Branding */
  primaryColor: string;
  secondaryColor: string;
  accentTextColor: string;
  logoPosition: "left" | "right" | "center";
  logoSize: number;

  /** Typography */
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  baseFontSize: number;
  headingFontSize: number;
  tableFontSize: number;
  footerFontSize: number;

  /** Table */
  tableStyle: "bordered" | "striped" | "minimal";
  /** Relative flex weights per visible column. */
  columnWidths: Partial<Record<ColumnKey, number>>;
  showColumn: Record<ColumnKey, boolean>;

  /** Sections */
  showNotes: boolean;
  showTerms: boolean;
  showSignature: boolean;
  showPaymentDetails: boolean;
  showBankDetails: boolean;
  showQr: boolean;
  showShipping: boolean;
  showPageNumbers: boolean;
  showFooter: boolean;
  showDueDate: boolean;
  showTaxSummary: boolean;

  /** Numbers */
  decimals: number;
  /** Round the grand total to a whole unit and show the rounding line. */
  roundTotal: boolean;
  dateFormat: "yyyy-MM-dd" | "dd/MM/yyyy" | "MM/dd/yyyy" | "d MMM yyyy";
};

/* -------------------------------------------------------------------------- */
/* Invoice                                                                     */
/* -------------------------------------------------------------------------- */

export type Invoice = {
  id: string;
  /**
   * Sparse overrides for the fixed wording printed on the document ("Bill To",
   * column headers, "Total", …). See lib/invoice/labels.ts. Only the labels the
   * user actually changed are stored.
   */
  labels?: import("./labels").InvoiceLabels;
  business: BusinessDetails;
  customer: CustomerDetails;
  invoice: InvoiceMeta;
  items: InvoiceItem[];
  taxes: Tax[];
  discounts: Discount[];
  charges: Charge[];
  payment: PaymentDetails;
  qr: QrSettings;
  notes?: string;
  terms?: string;
  signature: Signature;
  customFields: CustomField[];
  settings: InvoiceSettings;
  templateId: string;
  createdAt: string;
  updatedAt: string;
};

/* -------------------------------------------------------------------------- */
/* Computed totals                                                             */
/* -------------------------------------------------------------------------- */

/** Per-line computed amounts. All values are plain decimals, already rounded. */
export type ComputedItem = {
  id: string;
  /** quantity x rate, before any discount. */
  gross: number;
  discount: number;
  /** gross - discount. The taxable base for this line. */
  net: number;
  taxTotal: number;
  taxBreakdown: { taxId: string; name: string; rate: number; amount: number }[];
  /** net + exclusive tax. What the line contributes to the invoice total. */
  total: number;
};

export type ComputedTotals = {
  items: Record<string, ComputedItem>;
  /** Sum of line nets (after item discounts, before invoice discount). */
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  /** subtotal - invoice discount. */
  taxableBase: number;
  chargeTotal: number;
  taxTotal: number;
  taxSummary: { taxId: string; name: string; rate: number; amount: number }[];
  /** Applied only when settings.roundTotal is on. */
  rounding: number;
  total: number;
  /** Total expressed in words, for the "amount in words" line. */
  amountInWords: string;
};
