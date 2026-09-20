/**
 * @vitest-environment node
 *
 * Word export tests. Builds the real .docx package and checks it is a valid
 * OOXML zip containing the document part — the same code path the browser runs.
 */
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { Packer } from "docx";
import { buildInvoiceDocx, docxFilename } from "../docx";
import { computeTotals } from "../calculations";
import { createInvoice, createLineItem, createTax, makeId } from "../defaults";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function build(invoice: ReturnType<typeof createInvoice>) {
  return Packer.toBuffer(buildInvoiceDocx(invoice, computeTotals(invoice)));
}

describe("DOCX generation", () => {
  it("produces a valid .docx package", async () => {
    const invoice = createInvoice({
      business: { name: "Acme Studio", email: "billing@acme.test" },
      customer: { name: "Jane Roberts" },
      items: [createLineItem({ name: "Design work", quantity: 10, rate: 85 })],
    });

    const buffer = await build(invoice);
    // A .docx is a zip: the local file header magic is "PK\x03\x04".
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    // The main document part must be present in the package.
    expect(buffer.toString("latin1")).toContain("word/document.xml");
    expect(buffer.length).toBeGreaterThan(1000);
  }, 20000);

  it("embeds the logo, item images and signature", async () => {
    const invoice = createInvoice({
      business: { name: "Acme Studio", logo: TINY_PNG },
      customer: { name: "Jane Roberts" },
      items: [
        createLineItem({
          name: "Product",
          quantity: 1,
          rate: 50,
          images: [{ id: makeId("img"), src: TINY_PNG, width: 1, height: 1 }],
        }),
      ],
      signature: { src: TINY_PNG, width: 120, align: "right", name: "A. Founder" },
    });
    invoice.settings.showSignature = true;

    const buffer = await build(invoice);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    // Embedded media lands in the word/media/ folder of the package.
    expect(buffer.toString("latin1")).toContain("word/media/");
  }, 20000);

  it("handles taxes, discounts and many line items", async () => {
    const tax = createTax({ name: "GST", rate: 18 });
    const invoice = createInvoice({
      business: { name: "Acme" },
      customer: { name: "Jane" },
      taxes: [tax],
      items: Array.from({ length: 40 }, (_, i) =>
        createLineItem({ name: `Item ${i + 1}`, quantity: i + 1, rate: 19.99, taxIds: [tax.id] }),
      ),
    });

    const buffer = await build(invoice);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  }, 20000);

  it("uses the invoice's custom labels", async () => {
    const invoice = createInvoice({
      business: { name: "Acme" },
      customer: { name: "Jane" },
      items: [createLineItem({ name: "Work", quantity: 1, rate: 10 })],
      labels: { billTo: "Consignee", total: "Grand Total" },
    });

    // A .docx is a zip, so the text is compressed and not greppable in the raw
    // buffer — unzip it and read the main document part.
    const buffer = await build(invoice);
    const zip = await JSZip.loadAsync(buffer);
    const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";

    // Section headings are rendered upper-case as a styling choice, so compare
    // case-insensitively rather than asserting the presentation.
    expect(xml.toLowerCase()).toContain("consignee");
    expect(xml).toContain("Grand Total");
    // The default wording those overrode must not also appear.
    expect(xml.toLowerCase()).not.toContain("bill to");
  }, 20000);

  it("names the file after the invoice number", () => {
    const invoice = createInvoice();
    invoice.invoice.number = "INV-1001";
    expect(docxFilename(invoice)).toBe("invoice-INV-1001.docx");
  });
});
