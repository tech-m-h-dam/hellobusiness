"use client";

/**
 * Client-side PDF generation with @react-pdf/renderer.
 *
 * Why react-pdf and not html2canvas+jsPDF: rasterising the DOM produces a
 * picture of an invoice — blurry text, no selectable/searchable content, huge
 * files, and no control over page breaks (rows and images get sliced in half at
 * the page boundary). react-pdf emits real vector PDF with embedded text, and
 * gives us `wrap={false}` per row plus `fixed` headers/footers, which is what
 * spec section 17's "never cut table rows/images/headers" actually requires.
 *
 * This module is only ever reached through a dynamic import at the moment the
 * user clicks Download (see DownloadButton), so the ~400KB renderer never
 * enters the initial bundle of any page — including the blog and guides.
 *
 * Nothing here touches the network: the document is built and serialised in the
 * browser, and the resulting blob is handed straight to a download link.
 */
import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { ComputedTotals, Invoice, InvoiceItem } from "./types";
import { formatMoney } from "./money";
import { formatInvoiceDate } from "./format";
import { getTemplate } from "./templates";
import { type LabelKey, labelFor } from "./labels";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function money(invoice: Invoice, amount: number) {
  return formatMoney(amount, invoice.invoice.currency, invoice.invoice.locale);
}

/** The columns actually rendered, in document order. */
function visibleColumns(invoice: Invoice) {
  const show = invoice.settings.showColumn;
  return (
    ["index", "image", "name", "description", "sku", "hsn", "quantity", "unit", "rate", "discount", "tax", "amount"] as const
  ).filter((c) => show[c]);
}

/** Relative widths per column; `name` absorbs the remaining space. */
const COLUMN_FLEX: Record<string, number> = {
  index: 0.4,
  image: 1.1,
  name: 3.4,
  description: 3,
  sku: 1,
  hsn: 1,
  quantity: 0.8,
  unit: 0.6,
  rate: 1.1,
  discount: 1,
  tax: 1,
  amount: 1.3,
};

const RIGHT_ALIGNED = new Set(["quantity", "rate", "discount", "tax", "amount"]);

function makeStyles(invoice: Invoice) {
  const s = invoice.settings;
  return StyleSheet.create({
    page: {
      paddingTop: s.margin,
      paddingBottom: s.margin + (s.showPageNumbers ? 24 : 0),
      paddingHorizontal: s.margin,
      fontFamily: s.fontFamily,
      fontSize: s.baseFontSize,
      color: "#0f172a",
      backgroundColor: "#ffffff",
    },
    // A page with a full-bleed banner needs no top padding of its own.
    pageBanner: { paddingTop: 0 },
    row: { flexDirection: "row" },
    spaceBetween: { flexDirection: "row", justifyContent: "space-between" },
    bold: { fontWeight: 700 },
    muted: { color: "#64748b" },
    small: { fontSize: Math.max(6, s.baseFontSize - 2) },
    title: {
      fontSize: s.headingFontSize,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1,
      color: s.primaryColor,
    },
    banner: {
      backgroundColor: s.primaryColor,
      paddingHorizontal: s.margin,
      paddingVertical: 18,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    sidebar: {
      backgroundColor: s.primaryColor,
      color: "#ffffff",
      width: 150,
      paddingHorizontal: 14,
      paddingTop: s.margin,
      paddingBottom: s.margin,
      marginLeft: -s.margin,
      marginTop: -s.margin,
      marginBottom: -s.margin,
      marginRight: 16,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: s.tableStyle === "minimal" ? "transparent" : s.primaryColor,
      borderBottomWidth: s.tableStyle === "minimal" ? 1.5 : 0,
      borderBottomColor: s.primaryColor,
      paddingVertical: 5,
      paddingHorizontal: 2,
    },
    tableHeaderCell: {
      fontSize: Math.max(6, s.tableFontSize - 1.5),
      fontWeight: 700,
      textTransform: "uppercase",
      color: s.tableStyle === "minimal" ? "#475569" : "#ffffff",
      paddingHorizontal: 3,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 5,
      paddingHorizontal: 2,
      alignItems: "flex-start",
    },
    tableCell: { fontSize: s.tableFontSize, paddingHorizontal: 3 },
    totalsBox: { marginLeft: "auto", width: 200, marginTop: 14 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    grandTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: s.primaryColor,
      color: "#ffffff",
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginTop: 6,
      borderRadius: 3,
    },
    footer: {
      position: "absolute",
      bottom: 16,
      left: s.margin,
      right: s.margin,
      textAlign: "center",
      fontSize: s.footerFontSize,
      color: "#94a3b8",
    },
    sectionLabel: {
      fontSize: Math.max(6, s.baseFontSize - 2),
      fontWeight: 700,
      textTransform: "uppercase",
      color: "#64748b",
      marginBottom: 2,
    },
  });
}

type Styles = ReturnType<typeof makeStyles>;

/* -------------------------------------------------------------------------- */
/* Shared blocks                                                               */
/* -------------------------------------------------------------------------- */

function BusinessBlock({
  invoice,
  styles,
  light = false,
}: {
  invoice: Invoice;
  styles: Styles;
  light?: boolean;
}) {
  const b = invoice.business;
  const color = light ? "#ffffff" : "#0f172a";
  const sub = light ? "rgba(255,255,255,0.85)" : "#64748b";
  return (
    <View style={{ flexDirection: "row", gap: 8, maxWidth: 260 }}>
      {b.logo ? <PdfImage src={b.logo} style={{ width: b.logoWidth ?? 56, objectFit: "contain" }} /> : null}
      <View>
        <Text style={{ fontSize: invoice.settings.baseFontSize + 3, fontWeight: 700, color }}>
          {b.name || "Your Business Name"}
        </Text>
        <View style={{ marginTop: 2 }}>
          {[
            b.addressLine1,
            b.addressLine2,
            [b.city, b.state, b.postalCode].filter(Boolean).join(", ") || undefined,
            b.country,
            b.email,
            b.phone,
            b.website,
            b.gstin ? `GSTIN: ${b.gstin}` : undefined,
            b.taxId ? `Tax ID: ${b.taxId}` : undefined,
          ]
            .filter(Boolean)
            .map((line, i) => (
              <Text key={i} style={[styles.small, { color: sub }]}>
                {line}
              </Text>
            ))}
        </View>
      </View>
    </View>
  );
}

function MetaBlock({
  invoice,
  styles,
  align = "right",
  /** Suppressed for the banner layout, whose band already prints the title. */
  showTitle = true,
}: { invoice: Invoice; styles: Styles; align?: "left" | "right"; showTitle?: boolean }) {
  const m = invoice.invoice;
  const L = (key: LabelKey) => labelFor(invoice, key);
  const rows: [string, string | undefined][] = [
    [L("invoiceNumber"), m.number],
    [L("invoiceDate"), formatInvoiceDate(m.date, invoice.settings.dateFormat)],
    invoice.settings.showDueDate ? [L("dueDate"), formatInvoiceDate(m.dueDate, invoice.settings.dateFormat)] : ["", undefined],
    m.purchaseOrder ? [L("poNumber"), m.purchaseOrder] : ["", undefined],
    m.reference ? [L("reference"), m.reference] : ["", undefined],
  ];
  return (
    <View style={{ alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      {showTitle ? <Text style={styles.title}>{m.documentTitle || "Invoice"}</Text> : null}
      <View style={{ marginTop: 4 }}>
        {rows
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => (
            <View key={label} style={{ flexDirection: "row", gap: 6, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
              <Text style={[styles.small, styles.muted]}>{label}:</Text>
              <Text style={styles.small}>{value}</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

function PartiesBlock({ invoice, styles }: { invoice: Invoice; styles: Styles }) {
  const c = invoice.customer;
  return (
    <View style={{ flexDirection: "row", gap: 24, marginTop: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionLabel}>{labelFor(invoice, "billTo")}</Text>
        <Text style={{ fontWeight: 700 }}>{c.name || "Customer name"}</Text>
        {[c.company, c.billingAddress, c.email, c.phone, c.gstin ? `GSTIN: ${c.gstin}` : undefined]
          .filter(Boolean)
          .map((line, i) => (
            <Text key={i} style={[styles.small, styles.muted]}>
              {line}
            </Text>
          ))}
      </View>
      {invoice.settings.showShipping && c.shipToDifferentAddress && c.shippingAddress ? (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>{labelFor(invoice, "shipTo")}</Text>
          <Text style={[styles.small, styles.muted]}>{c.shippingAddress}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ItemImagesPdf({ item }: { item: InvoiceItem }) {
  if (!item.images.length) return null;
  const s = item.imageSettings;
  const single = s.layout === "large" || s.layout === "productCard";
  const images = single ? item.images.slice(0, 1) : item.images;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: s.gap,
        justifyContent: s.align === "center" ? "center" : s.align === "right" ? "flex-end" : "flex-start",
      }}
    >
      {images.map((img) => (
        <PdfImage
          key={img.id}
          src={img.src}
          style={{
            width: s.width,
            height: s.height,
            objectFit: s.fit,
            borderRadius: s.radius,
            ...(s.border ? { border: "1pt solid #e2e8f0" } : {}),
          }}
        />
      ))}
    </View>
  );
}

function ItemsTablePdf({ invoice, totals, styles }: { invoice: Invoice; totals: ComputedTotals; styles: Styles }) {
  const cols = visibleColumns(invoice);
  return (
    <View style={{ marginTop: 14 }}>
      {/* `fixed` repeats the header on every page of a long invoice. */}
      <View style={styles.tableHeader} fixed>
        {cols.map((c) => (
          <Text
            key={c}
            style={[
              styles.tableHeaderCell,
              { flex: COLUMN_FLEX[c], textAlign: RIGHT_ALIGNED.has(c) ? "right" : "left" },
            ]}
          >
            {labelFor(invoice, c as LabelKey)}
          </Text>
        ))}
      </View>

      {invoice.items.map((item, i) => {
        const computed = totals.items[item.id];
        const striped = invoice.settings.tableStyle === "striped" && i % 2 === 1;
        return (
          // wrap={false} is the guarantee that a row never splits across pages.
          <View
            key={item.id}
            style={[styles.tableRow, striped ? { backgroundColor: "#f8fafc" } : {}]}
            wrap={false}
          >
            {cols.map((c) => {
              const flexStyle = { flex: COLUMN_FLEX[c], textAlign: RIGHT_ALIGNED.has(c) ? ("right" as const) : ("left" as const) };
              if (c === "image") {
                return (
                  <View key={c} style={{ flex: COLUMN_FLEX[c], paddingHorizontal: 3 }}>
                    <ItemImagesPdf item={item} />
                  </View>
                );
              }
              if (c === "name") {
                return (
                  <View key={c} style={{ flex: COLUMN_FLEX[c], paddingHorizontal: 3 }}>
                    <Text style={[styles.tableCell, { paddingHorizontal: 0, fontWeight: 700 }]}>
                      {item.name || "Untitled item"}
                    </Text>
                    {/* Only shown here when Description has no column of its own. */}
                    {!invoice.settings.showColumn.description && item.description ? (
                      <Text style={[styles.tableCell, styles.muted, { paddingHorizontal: 0 }]}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                );
              }
              if (c === "description") {
                return (
                  <Text key={c} style={[styles.tableCell, styles.muted, { flex: COLUMN_FLEX[c] }]}>
                    {item.description ?? ""}
                  </Text>
                );
              }
              const value =
                c === "index"
                  ? String(i + 1)
                  : c === "sku"
                    ? (item.sku ?? "")
                    : c === "hsn"
                      ? (item.hsn ?? "")
                      : c === "quantity"
                        ? String(item.quantity)
                        : c === "unit"
                          ? (item.unit ?? "")
                          : c === "rate"
                            ? money(invoice, item.rate)
                            : c === "discount"
                              ? computed?.discount
                                ? money(invoice, computed.discount)
                                : "—"
                              : c === "tax"
                                ? computed?.taxTotal
                                  ? money(invoice, computed.taxTotal)
                                  : "—"
                                : computed
                                  ? money(invoice, computed.total)
                                  : "—";
              return (
                <Text key={c} style={[styles.tableCell, flexStyle, c === "amount" ? styles.bold : {}]}>
                  {value}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function TotalsPdf({ invoice, totals, styles }: { invoice: Invoice; totals: ComputedTotals; styles: Styles }) {
  const L = (key: LabelKey) => labelFor(invoice, key);
  const rows: [string, string][] = [[L("subtotal"), money(invoice, totals.subtotal)]];
  if (totals.itemDiscountTotal) rows.push([L("itemDiscounts"), `-${money(invoice, totals.itemDiscountTotal)}`]);
  if (totals.invoiceDiscountTotal) rows.push([L("discount"), `-${money(invoice, totals.invoiceDiscountTotal)}`]);
  if (invoice.settings.showTaxSummary) {
    for (const t of totals.taxSummary) {
      rows.push([`${t.name}${t.rate ? ` (${t.rate}%)` : ""}`, money(invoice, t.amount)]);
    }
  } else if (totals.taxTotal) {
    rows.push([L("tax"), money(invoice, totals.taxTotal)]);
  }
  for (const charge of invoice.charges) {
    if (charge.value) rows.push([charge.label || "Charge", money(invoice, charge.value)]);
  }
  if (totals.rounding) rows.push([L("rounding"), money(invoice, totals.rounding)]);

  return (
    // Keep the totals block whole — splitting it across pages looks broken.
    <View style={styles.totalsBox} wrap={false}>
      {rows.map(([label, value], i) => (
        <View key={`${label}-${i}`} style={styles.totalRow}>
          <Text style={[styles.small, styles.muted]}>{label}</Text>
          <Text style={styles.small}>{value}</Text>
        </View>
      ))}
      <View style={styles.grandTotal}>
        <Text style={{ fontWeight: 700 }}>{L("total")}</Text>
        <Text style={{ fontWeight: 700 }}>{money(invoice, totals.total)}</Text>
      </View>
      {totals.amountInWords ? (
        <Text style={[styles.small, styles.muted, { marginTop: 4, fontStyle: "italic" }]}>
          {L("amountInWords")}: {totals.amountInWords}
        </Text>
      ) : null}
    </View>
  );
}

/** E-Way Bill / transport details. */
function TransportPdf({ invoice, styles }: { invoice: Invoice; styles: Styles }) {
  if (!invoice.settings.showTransport) return null;
  const t = invoice.transport ?? {};
  const L = (key: LabelKey) => labelFor(invoice, key);

  const rows: [string, string | undefined][] = [
    [L("eWayBillNumber"), t.eWayBillNumber],
    [L("eWayBillDate"), t.eWayBillDate],
    [L("transporterName"), t.transporterName],
    [L("transporterId"), t.transporterId],
    [L("vehicleNumber"), t.vehicleNumber],
    [L("modeOfTransport"), t.modeOfTransport],
    [L("placeOfSupply"), t.placeOfSupply],
    [L("dispatchFrom"), t.dispatchFrom],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  if (!rows.length) return null;

  return (
    <View
      style={{
        marginTop: 14,
        borderWidth: 0.5,
        borderColor: "#e2e8f0",
        padding: 8,
        borderRadius: 3,
      }}
      wrap={false}
    >
      <Text style={styles.sectionLabel}>{L("transportDetails")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {rows.map(([label, value]) => (
          <View key={label} style={{ flexDirection: "row", gap: 4, width: "50%", paddingVertical: 1 }}>
            <Text style={[styles.small, styles.muted]}>{label}:</Text>
            <Text style={styles.small}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FooterAreaPdf({
  invoice,
  styles,
  qrDataUrl,
}: {
  invoice: Invoice;
  styles: Styles;
  qrDataUrl?: string;
}) {
  const s = invoice.settings;
  const p = invoice.payment;
  const showPayment =
    s.showPaymentDetails &&
    (p.upiId || p.paymentLink || p.instructions || (s.showBankDetails && (p.bankName || p.accountNumber)));

  return (
    <View style={{ marginTop: 22, flexDirection: "row", justifyContent: "space-between", gap: 24 }} wrap={false}>
      <View style={{ flex: 1, gap: 10 }}>
        {s.showNotes && invoice.notes ? (
          <View>
            <Text style={styles.sectionLabel}>{labelFor(invoice, "notes")}</Text>
            <Text style={[styles.small, styles.muted]}>{invoice.notes}</Text>
          </View>
        ) : null}
        {s.showTerms && invoice.terms ? (
          <View>
            <Text style={styles.sectionLabel}>{labelFor(invoice, "terms")}</Text>
            <Text style={[styles.small, styles.muted]}>{invoice.terms}</Text>
          </View>
        ) : null}
        {showPayment ? (
          <View>
            <Text style={styles.sectionLabel}>{labelFor(invoice, "paymentDetails")}</Text>
            {[
              s.showBankDetails && p.bankName ? `Bank: ${p.bankName}` : undefined,
              s.showBankDetails && p.accountName ? `Account name: ${p.accountName}` : undefined,
              s.showBankDetails && p.accountNumber ? `Account #: ${p.accountNumber}` : undefined,
              s.showBankDetails && p.ifsc ? `IFSC: ${p.ifsc}` : undefined,
              p.upiId ? `UPI: ${p.upiId}` : undefined,
              p.paymentLink ? `Pay online: ${p.paymentLink}` : undefined,
              p.instructions,
            ]
              .filter(Boolean)
              .map((line, i) => (
                <Text key={i} style={[styles.small, styles.muted]}>
                  {line}
                </Text>
              ))}
          </View>
        ) : null}
        {invoice.customFields.filter((f) => f.visible && f.section === "footer").map((f) => (
          <Text key={f.id} style={[styles.small, styles.muted]}>
            {f.label}: {f.value}
          </Text>
        ))}
      </View>

      <View style={{ alignItems: "center", gap: 10 }}>
        {s.showQr && qrDataUrl ? (
          <View style={{ alignItems: "center" }}>
            <PdfImage src={qrDataUrl} style={{ width: invoice.qr.size, height: invoice.qr.size }} />
            {invoice.qr.caption ? <Text style={styles.small}>{invoice.qr.caption}</Text> : null}
          </View>
        ) : null}
        {s.showSignature ? (
          <View style={{ alignItems: "center" }}>
            {invoice.signature.src ? (
              <PdfImage src={invoice.signature.src} style={{ width: invoice.signature.width, objectFit: "contain" }} />
            ) : (
              <View style={{ width: 130, borderBottomWidth: 0.5, borderBottomColor: "#94a3b8", height: 28 }} />
            )}
            {invoice.signature.name ? <Text style={styles.small}>{invoice.signature.name}</Text> : null}
            <Text style={[styles.small, styles.muted]}>
              {invoice.signature.label || labelFor(invoice, "authorizedSignature")}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Document                                                                    */
/* -------------------------------------------------------------------------- */

export function InvoicePdfDocument({
  invoice,
  totals,
  qrDataUrl,
}: {
  invoice: Invoice;
  totals: ComputedTotals;
  qrDataUrl?: string;
}) {
  const styles = makeStyles(invoice);
  const template = getTemplate(invoice.templateId);
  const layout = template.layout;
  const s = invoice.settings;

  const body = (
    <>
      <ItemsTablePdf invoice={invoice} totals={totals} styles={styles} />
      <TotalsPdf invoice={invoice} totals={totals} styles={styles} />
      <TransportPdf invoice={invoice} styles={styles} />
      <FooterAreaPdf invoice={invoice} styles={styles} qrDataUrl={qrDataUrl} />
    </>
  );

  return (
    <Document
      title={`Invoice ${invoice.invoice.number}`}
      author={invoice.business.name || undefined}
      creator="InvoiceFree"
      producer="InvoiceFree"
    >
      <Page
        // react-pdf names the US page size "LETTER"; our model stores "Letter".
        size={s.pageSize === "Letter" ? "LETTER" : "A4"}
        orientation={s.orientation}
        style={[styles.page, layout === "banner" ? styles.pageBanner : {}]}
      >
        {layout === "banner" && (
          <>
            <View style={styles.banner}>
              <BusinessBlock invoice={invoice} styles={styles} light />
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: s.headingFontSize, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: 1 }}>
                  {invoice.invoice.documentTitle || "Invoice"}
                </Text>
                <Text style={{ fontSize: s.baseFontSize, color: "rgba(255,255,255,0.9)" }}>
                  #{invoice.invoice.number}
                </Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 0 }}>
              <View style={styles.spaceBetween}>
                <PartiesBlock invoice={invoice} styles={styles} />
                <MetaBlock invoice={invoice} styles={styles} showTitle={false} />
              </View>
              {body}
            </View>
          </>
        )}

        {layout === "sidebar" && (
          <View style={{ flexDirection: "row" }}>
            <View style={styles.sidebar}>
              <BusinessBlock invoice={invoice} styles={styles} light />
              <View style={{ marginTop: 18 }}>
                <Text style={[styles.sectionLabel, { color: "rgba(255,255,255,0.6)" }]}>Bill To</Text>
                <Text style={{ color: "#ffffff", fontWeight: 700, fontSize: s.baseFontSize }}>
                  {invoice.customer.name || "Customer name"}
                </Text>
                {[invoice.customer.company, invoice.customer.billingAddress, invoice.customer.email]
                  .filter(Boolean)
                  .map((line, i) => (
                    <Text key={i} style={[styles.small, { color: "rgba(255,255,255,0.85)" }]}>
                      {line}
                    </Text>
                  ))}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <MetaBlock invoice={invoice} styles={styles} align="left" />
              {body}
            </View>
          </View>
        )}

        {(layout === "classic" || layout === "compact" || layout === "split") && (
          <>
            {layout === "split" ? (
              <View style={styles.spaceBetween}>
                <BusinessBlock invoice={invoice} styles={styles} />
                <View style={{ backgroundColor: s.primaryColor, padding: 12, borderRadius: 4, width: 190 }}>
                  <Text style={{ color: "#ffffff", fontWeight: 700, fontSize: s.headingFontSize - 4, textTransform: "uppercase", letterSpacing: 1 }}>
                    {invoice.invoice.documentTitle || "Invoice"}
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <View style={styles.spaceBetween}>
                      <Text style={[styles.small, { color: "rgba(255,255,255,0.85)" }]}>Invoice #</Text>
                      <Text style={[styles.small, { color: "#ffffff" }]}>{invoice.invoice.number}</Text>
                    </View>
                    <View style={styles.spaceBetween}>
                      <Text style={[styles.small, { color: "rgba(255,255,255,0.85)" }]}>Date</Text>
                      <Text style={[styles.small, { color: "#ffffff" }]}>
                        {formatInvoiceDate(invoice.invoice.date, s.dateFormat)}
                      </Text>
                    </View>
                    {s.showDueDate && invoice.invoice.dueDate ? (
                      <View style={styles.spaceBetween}>
                        <Text style={[styles.small, { color: "rgba(255,255,255,0.85)" }]}>Due</Text>
                        <Text style={[styles.small, { color: "#ffffff" }]}>
                          {formatInvoiceDate(invoice.invoice.dueDate, s.dateFormat)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.spaceBetween}>
                <BusinessBlock invoice={invoice} styles={styles} />
                <MetaBlock invoice={invoice} styles={styles} />
              </View>
            )}
            <PartiesBlock invoice={invoice} styles={styles} />
            {body}
          </>
        )}

        {s.showPageNumbers && (
          <Text
            style={styles.footer}
            fixed
            render={({ pageNumber, totalPages }) =>
              `${invoice.business.name || "Invoice"} · ${invoice.invoice.number} · Page ${pageNumber} of ${totalPages}`
            }
          />
        )}
      </Page>
    </Document>
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/** Build the QR payload for the invoice, if a QR is enabled and has content. */
export async function buildQrDataUrl(invoice: Invoice, total: number): Promise<string | undefined> {
  if (!invoice.settings.showQr || !invoice.qr.enabled) return undefined;

  let value: string | undefined;
  if (invoice.qr.source === "upi" && invoice.payment.upiId) {
    const params = new URLSearchParams({
      pa: invoice.payment.upiId,
      pn: invoice.business.name || "Payee",
      am: total.toFixed(2),
      cu: invoice.invoice.currency,
      tn: `Invoice ${invoice.invoice.number}`,
    });
    value = `upi://pay?${params.toString()}`;
  } else if (invoice.qr.source === "link") {
    value = invoice.payment.paymentLink || undefined;
  } else {
    value = invoice.qr.customValue || undefined;
  }
  if (!value) return undefined;

  // Lazily pulled in alongside the PDF engine, never in the initial bundle.
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(value, { margin: 1, width: 256, errorCorrectionLevel: "M" });
}

/** Render the invoice to a PDF Blob, entirely in the browser. */
export async function renderInvoicePdf(invoice: Invoice, totals: ComputedTotals): Promise<Blob> {
  const qrDataUrl = await buildQrDataUrl(invoice, totals.total);
  return pdf(<InvoicePdfDocument invoice={invoice} totals={totals} qrDataUrl={qrDataUrl} />).toBlob();
}

/** `invoice-INV-1001.pdf` */
export function pdfFilename(invoice: Invoice): string {
  const safe = (invoice.invoice.number || "invoice").replace(/[^\w.-]+/g, "-");
  return `invoice-${safe}.pdf`;
}
