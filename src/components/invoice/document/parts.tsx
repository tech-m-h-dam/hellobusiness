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
import { type LabelKey, labelFor } from "@/lib/invoice/labels";
import type { InlineEdit } from "@/lib/invoice/inline-edit";

export type DocProps = {
  invoice: Invoice;
  totals: ComputedTotals;
  /**
   * Supplied only by the interactive editor. When absent every field below
   * renders as plain text, which is what the static example pages and the
   * print/PDF paths need.
   */
  edit?: InlineEdit;
};

/**
 * Render `value` as editable text when editing is enabled, or as plain text
 * when it is not. Keeping the branch here means callers never have to care
 * which mode the document is in.
 */
function Editable({
  edit,
  value,
  display,
  onCommit,
  ariaLabel,
  placeholder,
  multiline,
  numeric,
  dateInput,
  className,
}: {
  edit?: InlineEdit;
  value: string;
  display?: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  dateInput?: boolean;
  className?: string;
}) {
  // Non-interactive consumers show the formatted text, never the raw value.
  if (!edit) return <>{display ?? value}</>;
  return edit.field({
    value,
    display,
    onCommit,
    ariaLabel,
    placeholder,
    multiline,
    numeric,
    dateInput,
    className,
  });
}

/** Rename a printed label in place — "click any label to rename it". */
function EditableLabel({
  edit,
  invoice,
  labelKey,
  className,
}: {
  edit?: InlineEdit;
  invoice: Invoice;
  labelKey: LabelKey;
  className?: string;
}) {
  const value = labelFor(invoice, labelKey);
  if (!edit) return <>{value}</>;
  return edit.field({
    value,
    ariaLabel: `Label: ${value}`,
    className,
    onCommit: (next) =>
      edit.patch((inv) => ({ ...inv, labels: { ...inv.labels, [labelKey]: next } })),
  });
}

function money(invoice: Invoice, amount: number) {
  return formatMoney(amount, invoice.invoice.currency, invoice.invoice.locale);
}

/* -------------------------------------------------------------------------- */

export function BusinessIdentity({ invoice, edit, tone = "dark" }: DocProps & { tone?: "dark" | "light" }) {
  const b = invoice.business;
  const setBiz = (key: keyof Invoice["business"], next: string) =>
    edit?.patch((inv) => ({ ...inv, business: { ...inv.business, [key]: next } }));
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
        <p className={`text-lg font-bold leading-tight ${textColor}`}>
          <Editable
            edit={edit}
            value={b.name}
            placeholder="Your Business Name"
            ariaLabel="Business name"
            onCommit={(v) => setBiz("name", v)}
          />
        </p>
        <div className={`mt-0.5 text-[11.5px] leading-snug ${subColor}`}>
          {(b.addressLine1 || edit) && (
            <p>
              <Editable
                edit={edit}
                value={b.addressLine1 ?? ""}
                placeholder="Street address"
                ariaLabel="Business address line 1"
                onCommit={(v) => setBiz("addressLine1", v)}
              />
            </p>
          )}
          {b.addressLine2 && <p>{b.addressLine2}</p>}
          {(b.city || b.state || b.postalCode) && (
            <p>{[b.city, b.state, b.postalCode].filter(Boolean).join(", ")}</p>
          )}
          {b.country && <p>{b.country}</p>}
          {(b.email || edit) && (
            <p>
              <Editable
                edit={edit}
                value={b.email ?? ""}
                placeholder="Email"
                ariaLabel="Business email"
                onCommit={(v) => setBiz("email", v)}
              />
            </p>
          )}
          {(b.phone || edit) && (
            <p>
              <Editable
                edit={edit}
                value={b.phone ?? ""}
                placeholder="Phone"
                ariaLabel="Business phone"
                onCommit={(v) => setBiz("phone", v)}
              />
            </p>
          )}
          {b.website && <p>{b.website}</p>}
          {b.gstin && <p>GSTIN: {b.gstin}</p>}
          {b.taxId && <p>Tax ID: {b.taxId}</p>}
        </div>
      </div>
    </div>
  );
}

export function InvoiceMetaBlock({ invoice, edit, align = "right" }: DocProps & { align?: "left" | "right" }) {
  const m = invoice.invoice;
  const setMeta = (key: keyof Invoice["invoice"], next: string) =>
    edit?.patch((inv) => ({ ...inv, invoice: { ...inv.invoice, [key]: next } }));

  // Dates are shown formatted but edited raw, so the field stays a date input
  // and the displayed format setting is not fighting the parser.
  const rows: {
    labelKey: LabelKey;
    display: string;
    raw: string;
    field: keyof Invoice["invoice"];
    show: boolean;
  }[] = [
    { labelKey: "invoiceNumber", display: m.number, raw: m.number, field: "number", show: true },
    {
      labelKey: "invoiceDate",
      display: formatInvoiceDate(m.date, invoice.settings.dateFormat),
      raw: m.date,
      field: "date",
      show: true,
    },
    {
      labelKey: "dueDate",
      display: formatInvoiceDate(m.dueDate, invoice.settings.dateFormat),
      raw: m.dueDate ?? "",
      field: "dueDate",
      show: invoice.settings.showDueDate,
    },
    {
      labelKey: "poNumber",
      display: m.purchaseOrder ?? "",
      raw: m.purchaseOrder ?? "",
      field: "purchaseOrder",
      show: Boolean(m.purchaseOrder) || Boolean(edit),
    },
    {
      labelKey: "reference",
      display: m.reference ?? "",
      raw: m.reference ?? "",
      field: "reference",
      show: Boolean(m.reference) || Boolean(edit),
    },
  ];
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: "var(--doc-primary)" }}>
        <Editable
          edit={edit}
          value={m.documentTitle}
          placeholder="Invoice"
          ariaLabel="Document title"
          onCommit={(v) => setMeta("documentTitle", v)}
        />
      </h1>
      <dl className="mt-2 space-y-0.5 text-[12px] text-ink-600">
        {rows.map((row) =>
          row.show && (row.display || edit) ? (
            <div key={row.labelKey} className={`flex gap-2 ${align === "right" ? "justify-end" : ""}`}>
              <dt className="font-medium text-ink-500">
                <EditableLabel edit={edit} invoice={invoice} labelKey={row.labelKey} />:
              </dt>
              <dd className="text-ink-800">
                <Editable
                  edit={edit}
                  value={row.raw}
                  display={row.display}
                  dateInput={row.field === "date" || row.field === "dueDate"}
                  ariaLabel={labelFor(invoice, row.labelKey)}
                  placeholder="—"
                  onCommit={(v) => setMeta(row.field, v)}
                />
              </dd>
            </div>
          ) : null,
        )}
      </dl>
    </div>
  );
}

export function PartiesBlock({ invoice, edit }: DocProps) {
  const c = invoice.customer;
  const setCustomer = (key: keyof Invoice["customer"], next: string) =>
    edit?.patch((inv) => ({ ...inv, customer: { ...inv.customer, [key]: next } }));
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          <EditableLabel edit={edit} invoice={invoice} labelKey="billTo" />
        </p>
        <p className="mt-1 text-[13px] font-semibold text-ink-900">
          <Editable
            edit={edit}
            value={c.name}
            placeholder="Customer name"
            ariaLabel="Customer name"
            onCommit={(v) => setCustomer("name", v)}
          />
        </p>
        <div className="mt-0.5 text-[11.5px] leading-snug text-ink-600">
          {(c.company || edit) && (
            <p>
              <Editable
                edit={edit}
                value={c.company ?? ""}
                placeholder="Company"
                ariaLabel="Customer company"
                onCommit={(v) => setCustomer("company", v)}
              />
            </p>
          )}
          {(c.billingAddress || edit) && (
            <div className="whitespace-pre-line">
              <Editable
                edit={edit}
                value={c.billingAddress ?? ""}
                placeholder="Billing address"
                ariaLabel="Billing address"
                multiline
                onCommit={(v) => setCustomer("billingAddress", v)}
              />
            </div>
          )}
          {(c.email || edit) && (
            <p>
              <Editable
                edit={edit}
                value={c.email ?? ""}
                placeholder="Email"
                ariaLabel="Customer email"
                onCommit={(v) => setCustomer("email", v)}
              />
            </p>
          )}
          {c.phone && <p>{c.phone}</p>}
          {c.gstin && <p>GSTIN: {c.gstin}</p>}
          {c.taxId && <p>Tax ID: {c.taxId}</p>}
        </div>
      </div>
      {invoice.settings.showShipping && c.shipToDifferentAddress && c.shippingAddress && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            <EditableLabel edit={edit} invoice={invoice} labelKey="shipTo" />
          </p>
          <div className="mt-1 whitespace-pre-line text-[11.5px] leading-snug text-ink-600">
            <Editable
              edit={edit}
              value={c.shippingAddress ?? ""}
              placeholder="Shipping address"
              ariaLabel="Shipping address"
              multiline
              onCommit={(v) => setCustomer("shippingAddress", v)}
            />
          </div>
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

export function ItemsTable({ invoice, totals, edit }: DocProps) {
  const { settings } = invoice;
  const setItem = (id: string, key: keyof Invoice["items"][number], next: string | number) =>
    edit?.patch((inv) => ({
      ...inv,
      items: inv.items.map((it) => (it.id === id ? { ...it, [key]: next } : it)),
    }));
  const show = settings.showColumn;
  const cols = (
    ["index", "image", "name", "description", "sku", "hsn", "quantity", "unit", "rate", "discount", "tax", "amount"] as const
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
              <EditableLabel edit={edit} invoice={invoice} labelKey={c as LabelKey} />
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
                      <p className="font-medium text-ink-900">
                        <Editable
                          edit={edit}
                          value={item.name}
                          placeholder="Item name"
                          ariaLabel={`Item ${i + 1} name`}
                          onCommit={(v) => setItem(item.id, "name", v)}
                        />
                      </p>
                      {/* When Description has no column of its own it sits under
                          the item name, which is the conventional invoice style. */}
                      {!show.description && (item.description || edit) && (
                        <div className="mt-0.5 whitespace-pre-line text-ink-500">
                          <Editable
                            edit={edit}
                            value={item.description ?? ""}
                            placeholder="Description"
                            ariaLabel={`Item ${i + 1} description`}
                            multiline
                            onCommit={(v) => setItem(item.id, "description", v)}
                          />
                        </div>
                      )}
                    </td>
                  );
                if (c === "description")
                  return (
                    <td key={c} className="px-2.5 py-2.5 whitespace-pre-line text-ink-600">
                      <Editable
                        edit={edit}
                        value={item.description ?? ""}
                        placeholder="Description"
                        ariaLabel={`Item ${i + 1} description`}
                        multiline
                        onCommit={(v) => setItem(item.id, "description", v)}
                      />
                    </td>
                  );
                if (c === "sku")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-ink-600">
                      <Editable
                        edit={edit}
                        value={item.sku ?? ""}
                        placeholder="SKU"
                        ariaLabel={`Item ${i + 1} SKU`}
                        onCommit={(v) => setItem(item.id, "sku", v)}
                      />
                    </td>
                  );
                if (c === "hsn")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-ink-600">
                      <Editable
                        edit={edit}
                        value={item.hsn ?? ""}
                        placeholder="HSN/SAC"
                        ariaLabel={`Item ${i + 1} HSN or SAC code`}
                        onCommit={(v) => setItem(item.id, "hsn", v)}
                      />
                    </td>
                  );
                if (c === "quantity")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-right text-ink-700">
                      {/* The unit is appended here only when it has no column of
                          its own, otherwise it would be printed twice. */}
                      <Editable
                        edit={edit}
                        value={String(item.quantity)}
                        ariaLabel={`Item ${i + 1} quantity`}
                        numeric
                        className="text-right"
                        onCommit={(v) => setItem(item.id, "quantity", Number(v) || 0)}
                      />
                      {!show.unit && item.unit ? ` ${item.unit}` : ""}
                    </td>
                  );
                if (c === "unit")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-ink-600">
                      <Editable
                        edit={edit}
                        value={item.unit ?? ""}
                        placeholder="unit"
                        ariaLabel={`Item ${i + 1} unit`}
                        onCommit={(v) => setItem(item.id, "unit", v)}
                      />
                    </td>
                  );
                if (c === "rate")
                  return (
                    <td key={c} className="px-2.5 py-2.5 text-right text-ink-700">
                      <Editable
                        edit={edit}
                        value={String(item.rate)}
                        display={money(invoice, item.rate)}
                        ariaLabel={`Item ${i + 1} rate`}
                        numeric
                        className="text-right"
                        onCommit={(v) => setItem(item.id, "rate", Number(v) || 0)}
                      />
                    </td>
                  );
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

export function TotalsBlock({ invoice, totals, edit }: DocProps) {
  const L = (key: LabelKey) => labelFor(invoice, key);
  const rows: [string, string, boolean?][] = [
    [L("subtotal"), money(invoice, totals.subtotal)],
  ];
  if (totals.itemDiscountTotal) rows.push([L("itemDiscounts"), `-${money(invoice, totals.itemDiscountTotal)}`]);
  if (totals.invoiceDiscountTotal) rows.push([L("discount"), `-${money(invoice, totals.invoiceDiscountTotal)}`]);
  if (invoice.settings.showTaxSummary) {
    for (const t of totals.taxSummary) {
      rows.push([`${t.name}${t.rate ? ` (${t.rate}%)` : ""}`, money(invoice, t.amount)]);
    }
  } else if (totals.taxTotal) {
    rows.push([L("tax"), money(invoice, totals.taxTotal)]);
  }
  if (totals.chargeTotal) {
    for (const charge of invoice.charges) {
      rows.push([charge.label || "Charge", money(invoice, charge.value)]);
    }
  }
  if (totals.rounding) rows.push([L("rounding"), money(invoice, totals.rounding)]);

  return (
    <div className="ml-auto w-full max-w-xs">
      <dl className="space-y-1.5 text-[12px]">
        {rows.map(([label, value], i) => (
          <div key={`${label}-${i}`} className="flex justify-between text-ink-600">
            {/* Only the fixed rows carry a renameable label; per-tax rows are
                named by the tax itself, which is edited in the Tax panel. */}
            <dt>{label}</dt>
            <dd className="text-ink-800">{value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="mt-3 flex justify-between rounded-md px-3 py-2.5 text-[15px] font-bold text-white"
        style={{ backgroundColor: "var(--doc-primary)" }}
      >
        <span>
          <EditableLabel edit={edit} invoice={invoice} labelKey="total" />
        </span>
        <span>{money(invoice, totals.total)}</span>
      </div>
      {totals.amountInWords && (
        <p className="mt-2 text-[10.5px] italic text-ink-500">
          {L("amountInWords")}: {totals.amountInWords}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer: notes, terms, payment, signature, QR                               */
/* -------------------------------------------------------------------------- */

export function PaymentBlock({ invoice, edit }: DocProps) {
  const p = invoice.payment;
  if (!invoice.settings.showPaymentDetails) return null;
  const hasBank = invoice.settings.showBankDetails && (p.bankName || p.accountNumber || p.iban || p.swift);
  if (!hasBank && !p.upiId && !p.paymentLink && !p.instructions) return null;
  return (
    <div className="text-[11px] text-ink-600">
      <p className="font-semibold uppercase tracking-wide text-ink-500">
        <EditableLabel edit={edit} invoice={invoice} labelKey="paymentDetails" />
      </p>
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

/** E-Way Bill / transport details, printed as a labelled grid. */
export function TransportBlock({ invoice, edit }: DocProps) {
  if (!invoice.settings.showTransport) return null;
  const t = invoice.transport ?? {};

  const rows: { key: LabelKey; field: keyof NonNullable<Invoice["transport"]> }[] = [
    { key: "eWayBillNumber", field: "eWayBillNumber" },
    { key: "eWayBillDate", field: "eWayBillDate" },
    { key: "transporterName", field: "transporterName" },
    { key: "transporterId", field: "transporterId" },
    { key: "vehicleNumber", field: "vehicleNumber" },
    { key: "modeOfTransport", field: "modeOfTransport" },
    { key: "placeOfSupply", field: "placeOfSupply" },
    { key: "dispatchFrom", field: "dispatchFrom" },
  ];

  const visible = rows.filter((r) => t[r.field] || edit);
  if (!visible.length) return null;

  const setTransport = (field: keyof NonNullable<Invoice["transport"]>, next: string) =>
    edit?.patch((inv) => ({ ...inv, transport: { ...inv.transport, [field]: next } }));

  return (
    <div className="mt-4 rounded border border-ink-200 p-2.5 text-[11px] text-ink-600">
      <p className="font-semibold uppercase tracking-wide text-ink-500">
        <EditableLabel edit={edit} invoice={invoice} labelKey="transportDetails" />
      </p>
      <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
        {visible.map((row) => (
          <div key={row.key} className="flex gap-1.5">
            <dt className="font-medium text-ink-500">
              <EditableLabel edit={edit} invoice={invoice} labelKey={row.key} />:
            </dt>
            <dd className="text-ink-800">
              <Editable
                edit={edit}
                value={t[row.field] ?? ""}
                placeholder="—"
                ariaLabel={labelFor(invoice, row.key)}
                onCommit={(v) => setTransport(row.field, v)}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function NotesTermsBlock({ invoice, edit }: DocProps) {
  if (!invoice.settings.showNotes && !invoice.settings.showTerms) return null;
  const setField = (key: "notes" | "terms", next: string) =>
    edit?.patch((inv) => ({ ...inv, [key]: next }));
  return (
    <div className="space-y-3 text-[11px] text-ink-600">
      {invoice.settings.showNotes && (invoice.notes || edit) && (
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-500">
            <EditableLabel edit={edit} invoice={invoice} labelKey="notes" />
          </p>
          <div className="mt-1 whitespace-pre-line">
            <Editable
              edit={edit}
              value={invoice.notes ?? ""}
              placeholder="Notes"
              ariaLabel="Invoice notes"
              multiline
              onCommit={(v) => setField("notes", v)}
            />
          </div>
        </div>
      )}
      {invoice.settings.showTerms && (invoice.terms || edit) && (
        <div>
          <p className="font-semibold uppercase tracking-wide text-ink-500">
            <EditableLabel edit={edit} invoice={invoice} labelKey="terms" />
          </p>
          <div className="mt-1 whitespace-pre-line">
            <Editable
              edit={edit}
              value={invoice.terms ?? ""}
              placeholder="Terms & conditions"
              ariaLabel="Invoice terms"
              multiline
              onCommit={(v) => setField("terms", v)}
            />
          </div>
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
      <p className="text-[10px] text-ink-500">{s.label || labelFor(invoice, "authorizedSignature")}</p>
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
