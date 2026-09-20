/**
 * Client-side Word (.docx) export.
 *
 * Same principle as the PDF path: the document is built in the browser with the
 * `docx` library and handed straight to a download, so invoice data still never
 * reaches a server. Loaded through a dynamic import in the download handler, so
 * it costs nothing until someone actually asks for a Word file.
 *
 * Why a real .docx and not an .doc HTML blob: renaming an HTML file to .doc
 * makes Word show a "file format doesn't match" warning, loses the table
 * structure on some versions, and can't carry embedded images reliably. A real
 * OOXML package opens cleanly in Word, Google Docs, Pages and LibreOffice, and
 * stays editable — which is the entire point of offering Word alongside PDF.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ComputedTotals, Invoice } from "./types";
import { formatMoney } from "./money";
import { formatInvoiceDate } from "./format";
import { labelFor } from "./labels";

function money(invoice: Invoice, amount: number) {
  return formatMoney(amount, invoice.invoice.currency, invoice.invoice.locale);
}

/** Strip the "#rrggbb" hash — docx wants bare hex. */
function hex(color: string): string {
  return color.replace("#", "").slice(0, 6) || "2563EB";
}

/** Decode a data URL into the bytes docx needs for an embedded image. */
function dataUrlToBytes(dataUrl: string): { data: Uint8Array; type: "png" | "jpg" } | null {
  const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    // docx supports png/jpg; webp is re-labelled as png which Word tolerates
    // for the common case, and our own pipeline emits png/jpeg anyway.
    return { data: bytes, type: match[1].toLowerCase().startsWith("p") ? "png" : "jpg" };
  } catch {
    return null;
  }
}

function text(value: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({
    text: value,
    bold: opts.bold,
    // docx sizes are in half-points.
    size: (opts.size ?? 10) * 2,
    color: opts.color,
  });
}

function para(
  value: string,
  opts: { bold?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number } = {},
) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 40 },
    children: [text(value, opts)],
  });
}

function cell(
  children: Paragraph[],
  opts: { width?: number; shading?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
) {
  return new TableCell({
    children,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { fill: opts.shading } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  });
}

/** Build the .docx document for an invoice. */
export function buildInvoiceDocx(invoice: Invoice, totals: ComputedTotals): Document {
  const s = invoice.settings;
  const primary = hex(s.primaryColor);
  const L = (key: Parameters<typeof labelFor>[1]) => labelFor(invoice, key);

  const children: (Paragraph | Table)[] = [];

  /* --- Header: business + document title ------------------------------- */
  const logo = invoice.business.logo ? dataUrlToBytes(invoice.business.logo) : null;
  if (logo) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new ImageRun({
            type: logo.type,
            data: logo.data,
            transformation: { width: s.logoSize, height: Math.round(s.logoSize * 0.5) },
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 80 },
      children: [text(invoice.invoice.documentTitle || "Invoice", { bold: true, size: 20, color: primary })],
    }),
  );

  children.push(para(invoice.business.name || "Your Business Name", { bold: true, size: 13 }));
  for (const line of [
    invoice.business.addressLine1,
    invoice.business.addressLine2,
    [invoice.business.city, invoice.business.state, invoice.business.postalCode].filter(Boolean).join(", ") || undefined,
    invoice.business.country,
    invoice.business.email,
    invoice.business.phone,
    invoice.business.website,
    invoice.business.gstin ? `GSTIN: ${invoice.business.gstin}` : undefined,
    invoice.business.taxId ? `Tax ID: ${invoice.business.taxId}` : undefined,
  ]) {
    if (line) children.push(para(line, { size: 9, color: "555555" }));
  }

  /* --- Invoice meta ----------------------------------------------------- */
  children.push(new Paragraph({ spacing: { before: 200, after: 40 }, children: [] }));
  const metaRows: [string, string | undefined][] = [
    [L("invoiceNumber"), invoice.invoice.number],
    [L("invoiceDate"), formatInvoiceDate(invoice.invoice.date, s.dateFormat)],
    s.showDueDate ? [L("dueDate"), formatInvoiceDate(invoice.invoice.dueDate, s.dateFormat)] : ["", undefined],
    invoice.invoice.purchaseOrder ? [L("poNumber"), invoice.invoice.purchaseOrder] : ["", undefined],
    invoice.invoice.reference ? [L("reference"), invoice.invoice.reference] : ["", undefined],
    ...invoice.customFields
      .filter((f) => f.visible && f.section === "invoice")
      .map((f) => [f.label, f.value] as [string, string]),
  ];
  for (const [label, value] of metaRows) {
    if (value) children.push(para(`${label}: ${value}`, { size: 9 }));
  }

  /* --- Bill to ---------------------------------------------------------- */
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [text(L("billTo").toUpperCase(), { bold: true, size: 9, color: "777777" })],
    }),
  );
  children.push(para(invoice.customer.name || "Customer name", { bold: true, size: 11 }));
  for (const line of [
    invoice.customer.company,
    invoice.customer.billingAddress,
    invoice.customer.email,
    invoice.customer.phone,
    invoice.customer.gstin ? `GSTIN: ${invoice.customer.gstin}` : undefined,
  ]) {
    if (line) children.push(para(line, { size: 9, color: "555555" }));
  }

  if (s.showShipping && invoice.customer.shipToDifferentAddress && invoice.customer.shippingAddress) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 60 },
        children: [text(L("shipTo").toUpperCase(), { bold: true, size: 9, color: "777777" })],
      }),
    );
    children.push(para(invoice.customer.shippingAddress, { size: 9, color: "555555" }));
  }

  /* --- Items table ------------------------------------------------------ */
  const cols = (
    ["index", "name", "description", "sku", "hsn", "quantity", "unit", "rate", "discount", "tax", "amount"] as const
  ).filter((c) => s.showColumn[c]);

  const headerRow = new TableRow({
    tableHeader: true,
    children: cols.map((c) =>
      cell([para(L(c), { bold: true, size: 9, color: "FFFFFF" })], { shading: primary }),
    ),
  });

  const bodyRows = invoice.items.map((item, i) => {
    const computed = totals.items[item.id];
    return new TableRow({
      children: cols.map((c) => {
        if (c === "name") {
          const paras = [para(item.name || "Untitled item", { bold: true, size: 9 })];
          // Only under the name when Description has no column of its own.
          if (!s.showColumn.description && item.description)
            paras.push(para(item.description, { size: 8, color: "666666" }));
          // Item images are embedded directly beneath the item name.
          for (const img of item.images) {
            const bytes = dataUrlToBytes(img.src);
            if (!bytes) continue;
            paras.push(
              new Paragraph({
                spacing: { before: 60 },
                children: [
                  new ImageRun({
                    type: bytes.type,
                    data: bytes.data,
                    transformation: {
                      width: item.imageSettings.width,
                      height: item.imageSettings.height,
                    },
                  }),
                ],
              }),
            );
          }
          return cell(paras);
        }

        const value =
          c === "index"
            ? String(i + 1)
            : c === "description"
              ? (item.description ?? "")
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

        const rightAligned = ["quantity", "rate", "discount", "tax", "amount"].includes(c);
        return cell(
          [
            para(value, {
              size: 9,
              bold: c === "amount",
              align: rightAligned ? AlignmentType.RIGHT : undefined,
            }),
          ],
        );
      }),
    });
  });

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows],
    }),
  );

  /* --- Totals ----------------------------------------------------------- */
  const totalRows: [string, string][] = [[L("subtotal"), money(invoice, totals.subtotal)]];
  if (totals.itemDiscountTotal) totalRows.push([L("itemDiscounts"), `-${money(invoice, totals.itemDiscountTotal)}`]);
  if (totals.invoiceDiscountTotal) totalRows.push([L("discount"), `-${money(invoice, totals.invoiceDiscountTotal)}`]);
  if (s.showTaxSummary) {
    for (const t of totals.taxSummary) {
      totalRows.push([`${t.name}${t.rate ? ` (${t.rate}%)` : ""}`, money(invoice, t.amount)]);
    }
  } else if (totals.taxTotal) {
    totalRows.push([L("tax"), money(invoice, totals.taxTotal)]);
  }
  for (const charge of invoice.charges) {
    if (charge.value) totalRows.push([charge.label || "Charge", money(invoice, charge.value)]);
  }
  if (totals.rounding) totalRows.push([L("rounding"), money(invoice, totals.rounding)]);

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  children.push(
    new Table({
      width: { size: 45, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.RIGHT,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [
        ...totalRows.map(
          ([label, value]) =>
            new TableRow({
              children: [
                cell([para(label, { size: 9, color: "555555" })]),
                cell([para(value, { size: 9, align: AlignmentType.RIGHT })]),
              ],
            }),
        ),
        new TableRow({
          children: [
            cell([para(L("total"), { bold: true, size: 12, color: "FFFFFF" })], { shading: primary }),
            cell([para(money(invoice, totals.total), { bold: true, size: 12, color: "FFFFFF", align: AlignmentType.RIGHT })], {
              shading: primary,
            }),
          ],
        }),
      ],
    }),
  );

  if (totals.amountInWords) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        alignment: AlignmentType.RIGHT,
        children: [text(`${L("amountInWords")}: ${totals.amountInWords}`, { size: 8, color: "666666" })],
      }),
    );
  }

  /* --- E-Way Bill / transport ------------------------------------------- */
  if (s.showTransport) {
    const tr = invoice.transport ?? {};
    const transportRows: [string, string | undefined][] = [
      [L("eWayBillNumber"), tr.eWayBillNumber],
      [L("eWayBillDate"), tr.eWayBillDate],
      [L("transporterName"), tr.transporterName],
      [L("transporterId"), tr.transporterId],
      [L("vehicleNumber"), tr.vehicleNumber],
      [L("modeOfTransport"), tr.modeOfTransport],
      [L("placeOfSupply"), tr.placeOfSupply],
      [L("dispatchFrom"), tr.dispatchFrom],
    ];
    const present = transportRows.filter(([, v]) => Boolean(v)) as [string, string][];

    if (present.length) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 40 },
          children: [text(L("transportDetails").toUpperCase(), { bold: true, size: 9, color: "777777" })],
        }),
      );
      for (const [label, value] of present) {
        children.push(para(`${label}: ${value}`, { size: 9, color: "555555" }));
      }
    }
  }

  /* --- Notes, terms, payment, signature --------------------------------- */
  if (s.showNotes && invoice.notes) {
    children.push(new Paragraph({ spacing: { before: 240, after: 40 }, children: [text(L("notes").toUpperCase(), { bold: true, size: 9, color: "777777" })] }));
    children.push(para(invoice.notes, { size: 9, color: "555555" }));
  }
  if (s.showTerms && invoice.terms) {
    children.push(new Paragraph({ spacing: { before: 160, after: 40 }, children: [text(L("terms").toUpperCase(), { bold: true, size: 9, color: "777777" })] }));
    children.push(para(invoice.terms, { size: 9, color: "555555" }));
  }

  const p = invoice.payment;
  if (s.showPaymentDetails) {
    const paymentLines = [
      s.showBankDetails && p.bankName ? `Bank: ${p.bankName}` : undefined,
      s.showBankDetails && p.accountName ? `Account name: ${p.accountName}` : undefined,
      s.showBankDetails && p.accountNumber ? `Account #: ${p.accountNumber}` : undefined,
      s.showBankDetails && p.ifsc ? `IFSC: ${p.ifsc}` : undefined,
      p.upiId ? `UPI: ${p.upiId}` : undefined,
      p.paymentLink ? `Pay online: ${p.paymentLink}` : undefined,
      p.instructions,
    ].filter(Boolean) as string[];

    if (paymentLines.length) {
      children.push(new Paragraph({ spacing: { before: 160, after: 40 }, children: [text(L("paymentDetails").toUpperCase(), { bold: true, size: 9, color: "777777" })] }));
      for (const line of paymentLines) children.push(para(line, { size: 9, color: "555555" }));
    }
  }

  if (s.showSignature) {
    const sig = invoice.signature.src ? dataUrlToBytes(invoice.signature.src) : null;
    children.push(new Paragraph({ spacing: { before: 280 }, children: [] }));
    if (sig) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              type: sig.type,
              data: sig.data,
              transformation: { width: invoice.signature.width, height: Math.round(invoice.signature.width * 0.4) },
            }),
          ],
        }),
      );
    }
    if (invoice.signature.name) {
      children.push(para(invoice.signature.name, { size: 9, bold: true, align: AlignmentType.RIGHT }));
    }
    children.push(
      para(invoice.signature.label || L("authorizedSignature"), { size: 8, color: "666666", align: AlignmentType.RIGHT }),
    );
  }

  return new Document({
    creator: invoice.business.name || "InvoiceFree",
    title: `${invoice.invoice.documentTitle || "Invoice"} ${invoice.invoice.number}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: s.margin * 15,
              bottom: s.margin * 15,
              left: s.margin * 15,
              right: s.margin * 15,
            },
          },
        },
        children,
      },
    ],
  });
}

/** Render the invoice to a .docx Blob, entirely in the browser. */
export async function renderInvoiceDocx(
  invoice: Invoice,
  totals: ComputedTotals,
): Promise<Blob> {
  const doc = buildInvoiceDocx(invoice, totals);
  return Packer.toBlob(doc);
}

/** `invoice-INV-1001.docx` */
export function docxFilename(invoice: Invoice): string {
  const safe = (invoice.invoice.number || "invoice").replace(/[^\w.-]+/g, "-");
  return `invoice-${safe}.docx`;
}
