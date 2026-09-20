/**
 * Template parity tests.
 *
 * Every template is the same data through a different composition, so the
 * interesting failures are per-template omissions: a block one layout forgets
 * to compose, which then appears in the PDF (whose layouts are coded
 * separately) but not on screen. That is exactly how the logo went missing
 * from the Product and Compact Mono templates while still exporting fine.
 *
 * These render each of the 20 templates and assert the invoice's content is
 * actually on the page, so a future layout cannot quietly drop a field.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvoiceDocument } from "../InvoiceDocument";
import { computeTotals } from "@/lib/invoice/calculations";
import { createInvoice, createLineItem } from "@/lib/invoice/defaults";
import { TEMPLATES } from "@/lib/invoice/templates";
import type { Invoice } from "@/lib/invoice/types";

/** A 1x1 transparent PNG — enough to assert the <img> is composed at all. */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function filledInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return createInvoice({
    business: {
      name: "Acme Studio",
      logo: TINY_PNG,
      logoWidth: 80,
      addressLine1: "12 Bridge Road",
      addressLine2: "Unit 4",
      city: "Pune",
      state: "MH",
      postalCode: "411001",
      country: "India",
      email: "hello@acme.test",
      phone: "+91 99999 00000",
      website: "acme.test",
      gstin: "27AAAAA0000A1Z5",
      taxId: "TAX-9",
    },
    customer: {
      name: "Globex Ltd",
      company: "Globex",
      email: "ap@globex.test",
      phone: "+91 88888 11111",
      billingAddress: "9 Market Street",
      gstin: "29BBBBB1111B1Z4",
      taxId: "CUS-7",
    },
    items: [createLineItem({ name: "Design sprint", quantity: 2, rate: 500 })],
    ...overrides,
  });
}

function render(invoice: Invoice) {
  return renderToStaticMarkup(
    <InvoiceDocument invoice={invoice} totals={computeTotals(invoice)} />,
  );
}

describe.each(TEMPLATES)("template: $name ($layout)", (template) => {
  const invoice = filledInvoice({ templateId: template.id });
  const html = render(invoice);

  it("renders the uploaded logo", () => {
    expect(html).toContain(TINY_PNG);
  });

  it("renders the business identity", () => {
    expect(html).toContain("Acme Studio");
    expect(html).toContain("12 Bridge Road");
    expect(html).toContain("hello@acme.test");
    expect(html).toContain("acme.test");
    expect(html).toContain("27AAAAA0000A1Z5");
  });

  it("renders the customer identity", () => {
    expect(html).toContain("Globex Ltd");
    expect(html).toContain("9 Market Street");
    expect(html).toContain("ap@globex.test");
    expect(html).toContain("+91 88888 11111");
    expect(html).toContain("29BBBBB1111B1Z4");
  });

  it("renders the line items and total", () => {
    expect(html).toContain("Design sprint");
    expect(html).toContain("1,000.00");
  });

  it("renders footer custom fields", () => {
    const withField = filledInvoice({
      templateId: template.id,
      customFields: [
        { id: "cf1", label: "Project code", value: "PRJ-42", visible: true, section: "footer" },
      ],
    });
    const out = render(withField);
    expect(out).toContain("Project code");
    expect(out).toContain("PRJ-42");
  });
});
