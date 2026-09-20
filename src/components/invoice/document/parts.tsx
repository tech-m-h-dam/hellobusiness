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
 *
 * Exported because the layouts themselves render a few fields directly — a
 * banner's title, a split header's dates — rather than only through the blocks
 * below. Those must go through this same helper or the field silently becomes
 * uneditable in that template only.
 */
export function Editable({
  edit,
  value,
  display,
  onCommit,
  ariaLabel,
  placeholder,
  multiline,
  numeric,
  dateInput,
  tone,
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
  tone?: "light" | "dark";
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
    tone,
    className,
  });
}

/** Rename a printed label in place — "click any label to rename it". */
export function EditableLabel({
  edit,
  invoice,
  labelKey,
  tone,
  className,
}: {
  edit?: InlineEdit;
  invoice: Invoice;
  labelKey: LabelKey;
  tone?: "light" | "dark";
  className?: string;
}) {
  const value = labelFor(invoice, labelKey);
  if (!edit) return <>{value}</>;
  return edit.field({
    value,
    ariaLabel: `Label: ${value}`,
    tone,
    className,
    onCommit: (next) =>
      edit.patch((inv) => ({ ...inv, labels: { ...inv.labels, [labelKey]: next } })),
  });
}

/**
 * Patch a field of `invoice.invoice`. Layouts that render meta fields outside
 * `InvoiceMetaBlock` need the same commit behaviour it uses.
 */
export function metaPatcher(edit: InlineEdit | undefined) {
  return (key: keyof Invoice["invoice"], next: string) =>
    edit?.patch((inv) => ({ ...inv, invoice: { ...inv.invoice, [key]: next } }));
}

function money(invoice: Invoice, amount: number) {
  return formatMoney(amount, invoice.invoice.currency, invoice.invoice.locale);
}

/* -------------------------------------------------------------------------- */

/**
 * Where the logo sits relative to the business text. This is `logoPosition`
 * from the template preset, applied here rather than in each layout — before,
 * only the banner looked at it, so "center" and "right" were silently ignored
 * by 18 of the 20 templates.
 */
const LOGO_LAYOUT: Record<"left" | "right" | "center", string> = {
  left: "flex-row items-start",
  right: "flex-row-reverse items-start",
  center: "flex-col items-center text-center",
};

/** The text fields of `business` — `logoWidth` is a number and edited by slider. */
type BizKey = Exclude<keyof Invoice["business"], "logo" | "logoWidth" | "logoAspect">;

/** Single-line business fields, in the order they print under the name. */
const BUSINESS_LINES: { key: BizKey; placeholder: string; label: string; prefix?: string }[] = [
  { key: "addressLine1", placeholder: "Street address", label: "Business address line 1" },
  { key: "addressLine2", placeholder: "Address line 2", label: "Business address line 2" },
];

/** City/state/postcode share one printed line but remain three separate fields. */
const BUSINESS_REGION: { key: BizKey; placeholder: string; label: string }[] = [
  { key: "city", placeholder: "City", label: "Business city" },
  { key: "state", placeholder: "State", label: "Business state" },
  { key: "postalCode", placeholder: "Postal code", label: "Business postal code" },
];

const BUSINESS_TAIL: { key: BizKey; placeholder: string; label: string; prefix?: string }[] = [
  { key: "country", placeholder: "Country", label: "Business country" },
  { key: "email", placeholder: "Email", label: "Business email" },
  { key: "phone", placeholder: "Phone", label: "Business phone" },
  { key: "website", placeholder: "Website", label: "Business website" },
  { key: "gstin", placeholder: "GSTIN", label: "Business GSTIN", prefix: "GSTIN: " },
  { key: "taxId", placeholder: "Tax ID", label: "Business tax ID", prefix: "Tax ID: " },
];

export function BusinessIdentity({
  invoice,
  edit,
  tone = "dark",
  /** `compact` only tightens type; it never drops fields (see CompactLayout). */
  size = "default",
}: DocProps & { tone?: "dark" | "light"; size?: "default" | "compact" }) {
  const b = invoice.business;
  const setBiz = (key: BizKey, next: string) =>
    edit?.patch((inv) => ({ ...inv, business: { ...inv.business, [key]: next } }));
  const textColor = tone === "light" ? "text-white" : "text-ink-900";
  const subColor = tone === "light" ? "text-white/80" : "text-ink-600";
  const nameSize = size === "compact" ? "text-[15px]" : "text-lg";
  const lineSize = size === "compact" ? "text-[10px]" : "text-[11.5px]";
  const position = invoice.settings.logoPosition ?? "left";

  const line = (
    f: { key: BizKey; placeholder: string; label: string; prefix?: string },
  ) => {
    const value = b[f.key] ?? "";
    if (!value && !edit) return null;
    return (
      <p key={f.key}>
        {value && f.prefix}
        <Editable
          edit={edit}
          value={value}
          placeholder={f.placeholder}
          ariaLabel={f.label}
          onCommit={(v) => setBiz(f.key, v)}
        />
      </p>
    );
  };

  // Empty parts stay rendered while editing so they remain clickable; with no
  // editor they collapse away and only the filled parts print.
  const region = BUSINESS_REGION.filter((f) => b[f.key] || edit);

  return (
    <div className={`flex gap-3 ${LOGO_LAYOUT[position] ?? LOGO_LAYOUT.left}`}>
      {b.logo && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL, next/image cannot optimize this
        <img
          src={b.logo}
          alt={`${b.name || "Business"} logo`}
          style={{ width: b.logoWidth ?? 64, height: "auto" }}
          className="max-h-20 shrink-0 object-contain"
        />
      )}
      <div className="min-w-0">
        <p className={`${nameSize} font-bold leading-tight ${textColor}`}>
          <Editable
            edit={edit}
            value={b.name}
            placeholder="Your Business Name"
            ariaLabel="Business name"
            onCommit={(v) => setBiz("name", v)}
          />
        </p>
        <div className={`mt-0.5 ${lineSize} leading-snug ${subColor}`}>
          {BUSINESS_LINES.map(line)}
          {region.length > 0 && (
            <p>
              {region.map((f, i) => (
                <span key={f.key}>
                  {i > 0 && ", "}
                  <Editable
                    edit={edit}
                    value={b[f.key] ?? ""}
                    placeholder={f.placeholder}
                    ariaLabel={f.label}
                    onCommit={(v) => setBiz(f.key, v)}
                  />
                </span>
              ))}
            </p>
          )}
          {BUSINESS_TAIL.map(line)}
        </div>
      </div>
    </div>
  );
}

export function InvoiceMetaBlock({
  invoice,
  edit,
  align = "right",
  /**
   * Layouts whose header already prints the document title (banner, split)
   * suppress it here so it is not rendered twice on the same page.
   */
  showTitle = true,
}: DocProps & { align?: "left" | "right"; showTitle?: boolean }) {
  const m = invoice.invoice;
  const setMeta = metaPatcher(edit);

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
      {showTitle && (
        <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: "var(--doc-primary)" }}>
          <Editable
            edit={edit}
            value={m.documentTitle}
            placeholder="Invoice"
            ariaLabel="Document title"
            onCommit={(v) => setMeta("documentTitle", v)}
          />
        </h1>
      )}
      <dl className={`space-y-0.5 text-[12px] text-ink-600 ${showTitle ? "mt-2" : ""}`}>
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

type CustomerKey = Exclude<keyof Invoice["customer"], "shipToDifferentAddress">;

/**
 * Customer lines under the name. Every one is editable — previously phone,
 * GSTIN and Tax ID rendered as plain text, so those three could be typed into
 * the side form but never corrected on the document itself.
 */
const CUSTOMER_LINES: { key: CustomerKey; placeholder: string; label: string; prefix?: string }[] = [
  { key: "company", placeholder: "Company", label: "Customer company" },
  { key: "email", placeholder: "Email", label: "Customer email" },
  { key: "phone", placeholder: "Phone", label: "Customer phone" },
  { key: "gstin", placeholder: "GSTIN", label: "Customer GSTIN", prefix: "GSTIN: " },
  { key: "taxId", placeholder: "Tax ID", label: "Customer tax ID", prefix: "Tax ID: " },
];

export function PartiesBlock({ invoice, edit, size = "default" }: DocProps & { size?: "default" | "compact" }) {
  const c = invoice.customer;
  const setCustomer = (key: CustomerKey, next: string) =>
    edit?.patch((inv) => ({ ...inv, customer: { ...inv.customer, [key]: next } }));
  const lineSize = size === "compact" ? "text-[10px]" : "text-[11.5px]";
  const nameSize = size === "compact" ? "text-[12px]" : "text-[13px]";

  // The ship-to column is gated on the settings toggle, but while editing it
  // stays visible with an empty address so the field remains reachable.
  const showShipTo =
    invoice.settings.showShipping &&
    Boolean(c.shipToDifferentAddress) &&
    (Boolean(c.shippingAddress) || Boolean(edit));

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          <EditableLabel edit={edit} invoice={invoice} labelKey="billTo" />
        </p>
        <p className={`mt-1 ${nameSize} font-semibold text-ink-900`}>
          <Editable
            edit={edit}
            value={c.name}
            placeholder="Customer name"
            ariaLabel="Customer name"
            onCommit={(v) => setCustomer("name", v)}
          />
        </p>
        <div className={`mt-0.5 ${lineSize} leading-snug text-ink-600`}>
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
          {CUSTOMER_LINES.map((f) => {
            const value = c[f.key] ?? "";
            if (!value && !edit) return null;
            return (
              <p key={f.key}>
                {value && f.prefix}
                <Editable
                  edit={edit}
                  value={value}
                  placeholder={f.placeholder}
                  ariaLabel={f.label}
                  onCommit={(v) => setCustomer(f.key, v)}
                />
              </p>
            );
          })}
        </div>
      </div>
      {showShipTo && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            <EditableLabel edit={edit} invoice={invoice} labelKey="shipTo" />
          </p>
          <div className={`mt-1 whitespace-pre-line ${lineSize} leading-snug text-ink-600`}>
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
  /**
   * Rows carry their `labelKey` rather than a resolved string, so the fixed
   * rows stay renameable in place like every other printed label. Rows named by
   * the data itself — a tax or a charge — have no key and print as plain text,
   * since renaming them belongs in the Tax/Charges panel where the name lives.
   */
  const rows: { key: LabelKey | null; label: string; value: string }[] = [
    { key: "subtotal", label: L("subtotal"), value: money(invoice, totals.subtotal) },
  ];
  if (totals.itemDiscountTotal)
    rows.push({ key: "itemDiscounts", label: L("itemDiscounts"), value: `-${money(invoice, totals.itemDiscountTotal)}` });
  if (totals.invoiceDiscountTotal)
    rows.push({ key: "discount", label: L("discount"), value: `-${money(invoice, totals.invoiceDiscountTotal)}` });
  if (invoice.settings.showTaxSummary) {
    for (const t of totals.taxSummary) {
      rows.push({ key: null, label: `${t.name}${t.rate ? ` (${t.rate}%)` : ""}`, value: money(invoice, t.amount) });
    }
  } else if (totals.taxTotal) {
    rows.push({ key: "tax", label: L("tax"), value: money(invoice, totals.taxTotal) });
  }
  if (totals.chargeTotal) {
    for (const charge of invoice.charges) {
      rows.push({ key: null, label: charge.label || "Charge", value: money(invoice, charge.value) });
    }
  }
  if (totals.rounding)
    rows.push({ key: "rounding", label: L("rounding"), value: money(invoice, totals.rounding) });

  return (
    <div className="ml-auto w-full max-w-xs" data-print-avoid-break>
      <dl className="space-y-1.5 text-[12px]">
        {rows.map((row, i) => (
          <div key={`${row.label}-${i}`} className="flex justify-between text-ink-600">
            <dt>
              {row.key ? (
                <EditableLabel edit={edit} invoice={invoice} labelKey={row.key} />
              ) : (
                row.label
              )}
            </dt>
            <dd className="text-ink-800">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="mt-3 flex justify-between rounded-md px-3 py-2.5 text-[15px] font-bold text-white"
        style={{ backgroundColor: "var(--doc-primary)" }}
      >
        <span>
          <EditableLabel edit={edit} invoice={invoice} labelKey="total" tone="light" />
        </span>
        <span>{money(invoice, totals.total)}</span>
      </div>
      {totals.amountInWords && (
        <p className="mt-2 text-[10.5px] italic text-ink-500">
          <EditableLabel edit={edit} invoice={invoice} labelKey="amountInWords" />:{" "}
          {totals.amountInWords}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer: notes, terms, payment, signature, QR                               */
/* -------------------------------------------------------------------------- */

type PaymentKey = Exclude<keyof Invoice["payment"], "instructions">;

/** Bank rows, with the prefix each one prints. */
const BANK_LINES: { key: PaymentKey; prefix: string; label: string }[] = [
  { key: "bankName", prefix: "Bank: ", label: "Bank name" },
  { key: "accountName", prefix: "Account name: ", label: "Account name" },
  { key: "accountNumber", prefix: "Account #: ", label: "Account number" },
  { key: "ifsc", prefix: "IFSC: ", label: "IFSC code" },
  { key: "swift", prefix: "SWIFT: ", label: "SWIFT code" },
  { key: "iban", prefix: "IBAN: ", label: "IBAN" },
  { key: "routingNumber", prefix: "Routing #: ", label: "Routing number" },
];

const PAY_LINES: { key: PaymentKey; prefix: string; label: string }[] = [
  { key: "upiId", prefix: "UPI: ", label: "UPI ID" },
  { key: "paymentLink", prefix: "Pay online: ", label: "Payment link" },
];

export function PaymentBlock({ invoice, edit }: DocProps) {
  const p = invoice.payment;
  if (!invoice.settings.showPaymentDetails) return null;
  const hasBank = invoice.settings.showBankDetails && BANK_LINES.some((f) => p[f.key]);
  // Nothing filled in and nothing to fill it with: stay off the document.
  // While editing the block is kept so the fields are reachable in place.
  if (!edit && !hasBank && !p.upiId && !p.paymentLink && !p.instructions) return null;

  const setPay = (key: PaymentKey | "instructions", next: string) =>
    edit?.patch((inv) => ({ ...inv, payment: { ...inv.payment, [key]: next } }));

  const line = (f: { key: PaymentKey; prefix: string; label: string }) => {
    const value = p[f.key] ?? "";
    if (!value && !edit) return null;
    return (
      <p key={f.key}>
        {value && f.prefix}
        <Editable
          edit={edit}
          value={value}
          placeholder={f.label}
          ariaLabel={f.label}
          onCommit={(v) => setPay(f.key, v)}
        />
      </p>
    );
  };

  return (
    <div className="text-[11px] text-ink-600">
      <p className="font-semibold uppercase tracking-wide text-ink-500">
        <EditableLabel edit={edit} invoice={invoice} labelKey="paymentDetails" />
      </p>
      <div className="mt-1 space-y-0.5">
        {(hasBank || edit) && invoice.settings.showBankDetails && BANK_LINES.map(line)}
        {PAY_LINES.map(line)}
        {(p.instructions || edit) && (
          <div className="whitespace-pre-line">
            <Editable
              edit={edit}
              value={p.instructions ?? ""}
              placeholder="Payment instructions"
              ariaLabel="Payment instructions"
              multiline
              onCommit={(v) => setPay("instructions", v)}
            />
          </div>
        )}
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

export function SignatureBlock({ invoice, edit }: DocProps) {
  if (!invoice.settings.showSignature) return null;
  const s = invoice.signature;
  const justify = s.align === "center" ? "items-center" : s.align === "left" ? "items-start" : "items-end";
  const setSig = (key: "name" | "label", next: string) =>
    edit?.patch((inv) => ({ ...inv, signature: { ...inv.signature, [key]: next } }));
  return (
    <div className={`flex flex-col ${justify}`} data-print-avoid-break>
      {s.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.src} alt="Signature" style={{ width: s.width, height: "auto" }} />
      ) : (
        <div className="h-12 w-40 border-b border-ink-300" />
      )}
      <p className="mt-1 text-[11px] font-medium text-ink-800">
        <Editable
          edit={edit}
          value={s.name ?? ""}
          placeholder="Signatory name"
          ariaLabel="Signatory name"
          onCommit={(v) => setSig("name", v)}
        />
      </p>
      <p className="text-[10px] text-ink-500">
        <Editable
          edit={edit}
          value={s.label ?? ""}
          display={s.label || labelFor(invoice, "authorizedSignature")}
          placeholder={labelFor(invoice, "authorizedSignature")}
          ariaLabel="Signature label"
          onCommit={(v) => setSig("label", v)}
        />
      </p>
    </div>
  );
}

export function CustomFieldsBlock({ invoice, edit, section }: DocProps & { section: string }) {
  const fields = invoice.customFields.filter((f) => f.visible && f.section === section);
  if (!fields.length) return null;
  // Both halves are editable: a custom field is user-named by definition, so
  // reading its label as fixed text was the one case where renaming in place
  // was impossible.
  const setField = (id: string, key: "label" | "value", next: string) =>
    edit?.patch((inv) => ({
      ...inv,
      customFields: inv.customFields.map((f) => (f.id === id ? { ...f, [key]: next } : f)),
    }));
  return (
    <dl className="space-y-0.5 text-[11px] text-ink-600">
      {fields.map((f) => (
        <div key={f.id} className="flex gap-2">
          <dt className="font-medium text-ink-500">
            <Editable
              edit={edit}
              value={f.label}
              placeholder="Field name"
              ariaLabel={`Custom field name: ${f.label}`}
              onCommit={(v) => setField(f.id, "label", v)}
            />
            :
          </dt>
          <dd>
            <Editable
              edit={edit}
              value={f.value}
              placeholder="Value"
              ariaLabel={f.label || "Custom field value"}
              onCommit={(v) => setField(f.id, "value", v)}
            />
          </dd>
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
