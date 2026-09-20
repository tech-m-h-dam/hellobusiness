/**
 * @vitest-environment node
 *
 * PDF generation tests.
 *
 * These render the real react-pdf document to a buffer, which exercises the
 * whole layout tree — style resolution, flex layout, page breaking, image
 * embedding. A layout mistake that would throw or produce a corrupt file in
 * the browser fails here too, so this covers the "PDF works / multi-page PDF
 * works" acceptance criteria without needing a browser.
 *
 * Runs in the `node` environment, not the project-wide jsdom one. jsdom gives
 * the test its own global realm, so a Node `Buffer` (which is what the image
 * decoder produces from a data URL) fails `instanceof Uint8Array` against
 * jsdom's separate `Uint8Array` — pdfkit then falls through to its
 * read-from-disk branch and throws on what it thinks is a file path. That is
 * an artefact of the test realm only; a browser has a single realm, and the
 * bundler resolves pdfkit's browser build there.
 */
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "../pdf";
import { computeTotals } from "../calculations";
import { createInvoice, createLineItem, createTax, makeId } from "../defaults";
import { TEMPLATES } from "../templates";
import type { Invoice } from "../types";

/** A 1x1 transparent PNG — enough to exercise the image embedding path. */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function render(invoice: Invoice) {
  const totals = computeTotals(invoice);
  return renderToBuffer(InvoicePdfDocument({ invoice, totals }));
}

/** PDFs declare their page count as `/Type /Page` objects in the file body. */
function countPages(buffer: Buffer): number {
  const matches = buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g);
  return matches?.length ?? 0;
}

describe("PDF generation", () => {
  it("produces a valid PDF for a simple invoice", async () => {
    const invoice = createInvoice({
      business: { name: "Acme Studio", email: "billing@acme.test" },
      customer: { name: "Jane Roberts" },
      items: [createLineItem({ name: "Design work", quantity: 10, rate: 85 })],
    });

    const buffer = await render(invoice);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(1000);
  }, 20000);

  it("embeds a logo, item images and a signature without throwing", async () => {
    const invoice = createInvoice({
      business: { name: "Acme Studio", logo: TINY_PNG },
      customer: { name: "Jane Roberts" },
      items: [
        createLineItem({
          name: "Product with photos",
          quantity: 2,
          rate: 50,
          images: [
            { id: makeId("img"), src: TINY_PNG, width: 1, height: 1 },
            { id: makeId("img"), src: TINY_PNG, width: 1, height: 1 },
          ],
        }),
      ],
      signature: { src: TINY_PNG, width: 120, align: "right", name: "A. Founder" },
    });
    invoice.settings.showColumn.image = true;
    invoice.settings.showSignature = true;

    const buffer = await render(invoice);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  }, 20000);

  it("breaks a long invoice across multiple pages", async () => {
    const items = Array.from({ length: 60 }, (_, i) =>
      createLineItem({ name: `Line item ${i + 1}`, quantity: i + 1, rate: 19.99 }),
    );
    const invoice = createInvoice({
      business: { name: "Acme Studio" },
      customer: { name: "Jane Roberts" },
      items,
    });

    const buffer = await render(invoice);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(countPages(buffer)).toBeGreaterThan(1);
  }, 30000);

  it("renders every template layout", async () => {
    const tax = createTax({ name: "GST", rate: 18 });
    for (const template of TEMPLATES) {
      const invoice = createInvoice({
        templateId: template.id,
        business: { name: "Acme Studio", logo: TINY_PNG },
        customer: { name: "Jane Roberts", billingAddress: "12 Market Street" },
        items: [createLineItem({ name: "Consulting", quantity: 3, rate: 120, taxIds: [tax.id] })],
        taxes: [tax],
      });
      const buffer = await render(invoice);
      expect(buffer.subarray(0, 5).toString(), `template ${template.id} failed`).toBe("%PDF-");
    }
  }, 120000);

  it("renders Letter size and landscape orientation", async () => {
    const invoice = createInvoice({
      business: { name: "Acme Studio" },
      customer: { name: "Jane Roberts" },
      items: [createLineItem({ name: "Work", quantity: 1, rate: 100 })],
    });
    invoice.settings.pageSize = "Letter";
    invoice.settings.orientation = "landscape";

    const buffer = await render(invoice);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  }, 20000);
});
