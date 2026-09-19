/**
 * Shared building blocks for the HTML invoice document.
 *
 * Every layout (classic/banner/sidebar/split/compact) composes these same
 * parts differently — the parts themselves never know which layout they're
 * in, they only read `Invoice` + `ComputedTotals` + `InvoiceSettings`. This is
 * what keeps 20 template presets from becoming 20 forked renderers.
 *
 * These components render plain HTML/CSS (used for on-screen preview and for
 * the browser print path). The PDF path (lib/invoice/pdf.tsx) is a parallel,
 * react-pdf-native implementation of the same visual structure, since
 * react-pdf cannot render arbitrary HTML/CSS.
 */
import type { CSSProperties } from "react";
import type {
  ComputedTotals,
  Invoice,
  ItemImage,
  ItemImageSettings,
} from "@/lib/invoice/types";
import { formatMoney } from "@/lib/invoice/money";
import { formatInvoiceDate } from "@/lib/invoice/format";

export type DocProps = {
  invoice: Invoice;
  totals: ComputedTotals;
};

function money(invoice: Invoice, amount: number) {
  return formatMoney(amount, invoice.invoice.currency, invoice.invoice.locale);
}

/* -------------------------------------------------------------------------- */

export function BusinessIdentity({ invoice, tone = "dark" }: DocProps & { tone?: "dark" | "light" }) {
  const b = invoice.business;
  const textColor = tone === "light" ? "text-white" : "text-ink-900";
  const subColor = tone === "light" ? "text-white/80" : "text-ink-600";
  return (
    <div className="flex items-start gap-3">
      {b.logo && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, next/image cannot optimize this
        <img
          src={b.logo}
          alt={`${b.name || "Business"} logo`}
          style={{ width: b.logoWidth ?? 64, height: "auto" }}
          className="max-h-20 shrink-0 object-contain"
        />
      )}
      <div>
        <p className={`text-lg font-bold leading-tight ${textColor}`}>{b.name || "Your Business Name"}</p>
        <div className={`mt-0.5 text-[11.5px] leading-snug ${subColor}`}>
          {b.addressLine1 && <p>{b.addressLine1}</p>}
          {b.addressLine2 && <p>{b.addressLine2}</p>}
          {(b.city || b.state || b.postalCode) && (
            <p>{[b.city, b.state, b.postalCode].filter(Boolean).join(", ")}</p>
          )}
          {b.country && <p>{b.country}</p>}
          {b.email && <p>{b.email}</p>}
          {b.phone && <p>{b.phone}</p>}
          {b.website && <p>{b.website}</p>}
          {b.gstin && <p>GSTIN: {b.gstin}</p>}
          {b.taxId && <p>Tax ID: {b.taxId}</p>}
        </div>
      </div>
    </div>
  );
}

export function InvoiceMetaBlock({ invoice, align = "right" }: DocProps & { align?: "left" | "right" }) {
  const m = invoice.invoice;
  const rows: [string, string | undefined][] = [
    ["Invoice #", m.number],
    ["Date", formatInvoiceDate(m.date, invoice.settings.dateFormat)],
    ...(invoice.settings.showDueDate ? ([["Due Date", formatInvoiceDate(m.dueDate, invoice.settings.dateFormat)]] as [string, string][]) : []),
    ...(m.purchaseOrder ? ([["PO #", m.purchaseOrder]] as [string, string][]) : []),
    ...(m.reference ? ([["Reference", m.reference]] as [string, string][]) : []),
  ];
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: "var(--doc-primary)" }}>
        {m.documentTitle || "Invoice"}
      </h1>
      <dl className="mt-2 space-y-0.5 text-[12px] text-ink-600">
        {rows.map(([label, value]) =>
          value ? (
            <div key={label} className={`flex gap-2 ${align === "right" ? "justify-end" : ""}`}>
              <dt className="font-medium text-ink-500">{label}:</dt>
              <dd className="text-ink-800">{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </div>
  );
}

export function PartiesBlock({ invoice }: DocProps) {
  const c = invoice.customer;
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Bill To</p>
        <p className="mt-1 text-[13px] font-semibold text-ink-900">{c.name || "Customer name"}</p>
        <div className="mt-0.5 text-[11.5px] leading-snug text-ink-600">
          {c.company && <p>{c.company}</p>}
          {c.billingAddress && <p className="whitespace-pre-line">{c.billingAddress}</p>}
          {c.email && <p>{c.email}</p>}
          {c.phone && <p>{c.phone}</p>}
          {c.gstin && <p>GSTIN: {c.gstin}</p>}
          {c.taxId && <p>Tax ID: {c.taxId}</p>}
        </div>
      </div>
      {invoice.settings.showShipping && c.shipToDifferentAddress && c.shippingAddress && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Ship To</p>
          <p className="mt-1 whitespace-pre-line text-[11.5px] leading-snug text-ink-600">
            {c.shippingAddress}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Item images                                                                 */
/* -------------------------------------------------------------------------- */

export function ItemImages({ images, settings }: { images: ItemImage[]; settings: ItemImageSettings }) {
  if (!images?.length) return null;
  const box = { width: settings.width, height: settings.height };
  const radius = settings.radius;
  const border = settings.border ? "1px solid #e2e8f0" : "none";
  const fit = settings.fit;

  const imgStyle = (): CSSProperties => ({
    ...box,
    objectFit: fit,
    borderRadius: radius,
    border,
    display: "block",
  });

  const justify =
    settings.align === "center" ? "center" : settings.align === "right" ? "flex-end" : "flex-start";

  if (settings.layout === "large" || settings.layout === "productCard") {
    const [first] = images;
    return (
      <div style={{ display: "flex", justifyContent: justify }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={first.thumb ?? first.src} alt={first.alt ?? ""} style={imgStyle()} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: settings.gap, justifyContent: justify }}>
      {images.map((img) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={img.id} src={img.thumb ?? img.src} alt={img.alt ?? ""} style={imgStyle()} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Items table                                                                 */
/* -------------------------------------------------------------------------- */

const COLUMN_LABELS: Record<string, string> = {
  index: "#",
  image: "",
  name: "Item",
  sku: "SKU",
  hsn: "HSN/SAC",
  quantity: "Qty",
  unit: "Unit",
  rate: "Rate",
  discount: "Discount",
  tax: "Tax",
  amount: "Amount",
};

export function ItemsTable({ invoice, totals }: DocProps) {
  const { settings } = invoice;
  const show = settings.showColumn;
  const cols = (
    ["index", "image", "name", "sku", "hsn", "quantity", "unit", "rate", "discount", "tax", "amount"] as const
  ).filter((c) => show[c]);

  const isRightAligned = (c: string) =>
    ["quantity", "rate", "discount", "tax", "amount"].includes(c);

  const rowBorder =
    settings.tableStyle === "minimal" ? "border-b border-ink-100" : "border-b border-ink-200";

  return (
    <table className="w-full border-collapse text-[11.5px]" style={{ fontSize: settings.tableFontSize }}>
      <thead>
        <tr
          className={
            settings.tableStyle === "minimal"
              ? "border-b-2 text-ink-500"
              : "text-white"
          }
          style={
            settings.tableStyle === "minimal"
              ? { borderColor: "var(--doc-primary)" }
              : { backgroundColor: "var(--doc-primary)" }
          }
        >
          {cols.map((c) => (
            <th
              key={c}
              className={`px-2.5 py-2 text-left font-semibold uppercase tracking-wide ${isRightAligned(c) ? "text-right" : ""}`}
              style={{ fontSize: Math.max(8, settings.tableFontSize - 1.5) }}
            >
              {COLUMN_LABELS[c]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {invoice.items.map((item, i) => {
          const computed = totals.items[item.id];
          const striped = settings.tableStyle === "striped" && i % 2 === 1;
          return (
            <tr
              key={item.id}
              data-print-avoid-break
              className={`${rowBorder} ${striped ? "bg-ink-50" : ""} align-top`}
            >
              {cols.map((c) => {
                if (c === "index") return <td key={c} className="px-2.5 py-2.5 text-ink-500">{i + 1}</td>;
                if (c === "image")
                  return (
                    <td key={c} className="px-2.5 py-2.5">
                      <ItemImages images={item.images} settings={item.imageSettings} />
                    </td>
                  );
                if (c === "name")
                  return (
                    <td key={c} className="px-2.5 py-2.5">
                      <p className="font-medium text-ink-900">{item.name || "Untitled item"}</p>
                      {item.description && (
                        <p className="mt-0.5 whitespace-pre-line text-ink-500">{item.description}</p>
                      )}
                    </td>
                  );
                if (c === "sku") return <td key={c} className="px-2.5 py-2.5 text-ink-600">{item.sku}</td>;
                if (c === "hsn") return <td key={c} className="px-2.5 py-2.5 text-ink-600">{item.hsn}</td>;
                if (c === "quantity")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-right text-ink-700">
                      {item.quantity} {item.unit}
                    </td>
                  );
                if (c === "rate")
                  return <td key={c} className="px-2.5 py-2.5 text-right text-ink-700">{money(invoice, item.rate)}</td>;
                if (c === "discount")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-right text-ink-700">
                      {computed?.discount ? money(invoice, computed.discount) : "—"}
                    </td>
                  );
                if (c === "tax")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-right text-ink-700">
                      {computed?.taxTotal ? money(invoice, computed.taxTotal) : "—"}
                    </td>
                  );
                if (c === "amount")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-right font-medium text-ink-900">
                      {computed ? money(invoice, computed.total) : "—"}
                    </td>
                  );
                return null;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------------- */
/* Totals                                                                      */
/* -------------------------------------------------------------------------- */

export function TotalsBlock({ invoice, totals }: DocProps) {
  const rows: [string, string, boolean?][] = [
    ["Subtotal", money(invoice, totals.subtotal)],
  ];
  if (totals.itemDiscountTotal) rows.push(["Item discounts", `-${money(invoice, totals.itemDiscountTotal)}`]);
  if (totals.invoiceDiscountTotal) rows.push(["Discount", `-${money(invoice, totals.invoiceDiscountTotal)}`]);
  if (invoice.settings.showTaxSummary) {
    for (const t of totals.taxSummary) {
      rows.push([`${t.name}${t.rate ? ` (${t.rate}%)` : ""}`, money(invoice, t.amount)]);
    }
  } else if (totals.taxTotal) {
    rows.push(["Tax", money(invoice, totals.taxTotal)]);
  }
  if (totals.chargeTotal) {
    for (const charge of invoice.charges) {
      rows.push([charge.label || "Charge", money(invoice, charge.value)]);
    }
  }
  if (totals.rounding) rows.push(["Rounding", money(invoice, totals.rounding)]);

  return (
    <div className="ml-auto w-full max-w-xs">
      <dl className="space-y-1.5 text-[12px]">
        {rows.map(([label, value], i) => (
          <div key={`${label}-${i}`} className="flex justify-between text-ink-600">
            <dt>{label}</dt>
            <dd className="text-ink-800">{value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="mt-3 flex justify-between rounded-md px-3 py-2.5 text-[15px] font-bold text-white"
        style={{ backgroundColor: "var(--doc-primary)" }}
      >
        <span>Total</span>
        <span>{money(invoice, totals.total)}</span>
      </div>
      {totals.amountInWords && (
        <p className="mt-2 text-[10.5px] italic text-ink-500">Amount in words: {totals.amountInWords}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer: notes, terms, payment, signature, QR                               */
/* -------------------------------------------------------------------------- */

export function PaymentBlock({ invoice }: DocProps) {
  const p = invoice.payment;
  if (!invoice.settings.showPaymentDetails) return null;
  const hasBank = invoice.settings.showBankDetails && (p.bankName || p.accountNumber || p.iban || p.swift);
  if (!hasBank && !p.upiId && !p.paymentLink && !p.instructions) return null;
  return (
    <div className="text-[11px] text-ink-600">
      <p className="font-semibold uppercase tracking-wide text-ink-500">Payment Details</p>
      <div className="mt-1 space-y-0.5">
        {hasBank && (
          <>
            {p.bankName && <p>Bank: {p.bankName}</p>}
            {p.accountName && <p>Account name: {p.accountName}</p>}
            {p.accountNumber && <p>Account #: {p.accountNumber}</p>}
            {p.ifsc && <p>IFSC: {p.ifsc}</p>}
            {p.swift && <p>SWIFT: {p.swift}</p>}
            {p.iban && <p>IBAN: {p.iban}</p>}
            {p.routingNumber && <p>Routing #: {p.routingNumber}</p>}
          </>
        )}
        {p.upiId && <p>UPI: {p.upiId}</p>}
        {p.paymentLink && <p>Pay online: {p.paymentLink}</p>}
        {p.instructions && <p className="whitespace-pre-line">{p.instructions}</p>}
      </div>
    </div>
  );
}

export function NotesTermsBlock({ invoice }: DocProps) {
  if (!invoice.settings.showNotes && !invoice.settings.showTerms) return null;
  return (
    <div className="space-y-3 text-[11px] text-ink-600">
      {invoice.settings.showNotes && invoice.notes && (
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-500">Notes</p>
          <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
      {invoice.settings.showTerms && invoice.terms && (
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-500">Terms &amp; Conditions</p>
          <p className="mt-1 whitespace-pre-line">{invoice.terms}</p>
        </div>
      )}
    </div>
  );
}

export function SignatureBlock({ invoice }: DocProps) {
  if (!invoice.settings.showSignature) return null;
  const s = invoice.signature;
  const justify = s.align === "center" ? "items-center" : s.align === "left" ? "items-start" : "items-end";
  return (
    <div className={`flex flex-col ${justify}`}>
      {s.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.src} alt="Signature" style={{ width: s.width, height: "auto" }} />
      ) : (
        <div className="h-12 w-40 border-b border-ink-300" />
      )}
      <p className="mt-1 text-[11px] font-medium text-ink-800">{s.name}</p>
      <p className="text-[10px] text-ink-500">{s.label || "Authorized Signature"}</p>
    </div>
  );
}

export function CustomFieldsBlock({ invoice, section }: DocProps & { section: string }) {
  const fields = invoice.customFields.filter((f) => f.visible && f.section === section);
  if (!fields.length) return null;
  return (
    <dl className="space-y-0.5 text-[11px] text-ink-600">
      {fields.map((f) => (
        <div key={f.id} className="flex gap-2">
          <dt className="font-medium text-ink-500">{f.label}:</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PageFooter({ invoice }: DocProps) {
  if (!invoice.settings.showFooter) return null;
  return (
    <div className="mt-8 border-t border-ink-100 pt-3 text-center text-[10px] text-ink-400">
      <p>{invoice.business.name || "Invoice"} · {invoice.invoice.number}</p>
    </div>
  );
}
