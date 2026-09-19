import { describe, expect, it } from "vitest";
import { computeTotals } from "../calculations";
import { createInvoice, createLineItem, createTax, createDiscount, createCharge } from "../defaults";
import type { Invoice } from "../types";

/** A minimal invoice with a single controllable line item. */
function invoiceWithItem(item: Partial<Invoice["items"][number]>, overrides: Partial<Invoice> = {}) {
  return createInvoice({
    items: [createLineItem(item)],
    ...overrides,
  });
}

describe("computeTotals — basic arithmetic", () => {
  it("quantity x rate with no tax/discount", () => {
    const inv = invoiceWithItem({ quantity: 3, rate: 50 });
    const totals = computeTotals(inv);
    expect(totals.subtotal).toBe(150);
    expect(totals.total).toBe(150);
  });

  it("supports decimal quantities", () => {
    const inv = invoiceWithItem({ quantity: 2.5, rate: 40 });
    const totals = computeTotals(inv);
    expect(totals.subtotal).toBe(100);
  });

  it("supports negative line items (credit notes)", () => {
    const inv = invoiceWithItem({ quantity: 1, rate: -50 });
    const totals = computeTotals(inv);
    expect(totals.total).toBe(-50);
  });

  it("zero quantity and zero rate both yield a zero total without throwing", () => {
    const inv = invoiceWithItem({ quantity: 0, rate: 100 });
    expect(computeTotals(inv).total).toBe(0);
    const inv2 = invoiceWithItem({ quantity: 5, rate: 0 });
    expect(computeTotals(inv2).total).toBe(0);
  });

  it("handles large numbers without precision loss", () => {
    const inv = invoiceWithItem({ quantity: 1000, rate: 999999.99 });
    expect(computeTotals(inv).subtotal).toBeCloseTo(999999990, 2);
  });
});

describe("computeTotals — item-level discount", () => {
  it("percentage discount reduces the taxable base", () => {
    const inv = invoiceWithItem({ quantity: 1, rate: 100, discountValue: 10, discountType: "percentage" });
    const totals = computeTotals(inv);
    expect(totals.subtotal).toBe(90);
    expect(totals.itemDiscountTotal).toBe(10);
  });

  it("fixed discount is clamped so a line cannot go negative from discount alone", () => {
    const inv = invoiceWithItem({ quantity: 1, rate: 20, discountValue: 500, discountType: "fixed" });
    const totals = computeTotals(inv);
    expect(totals.subtotal).toBe(0);
    expect(totals.itemDiscountTotal).toBe(20);
  });
});

describe("computeTotals — invoice-level discount allocation", () => {
  it("percentage invoice discount applies proportionally across lines and sums exactly", () => {
    const inv = createInvoice({
      items: [
        createLineItem({ quantity: 1, rate: 100 }),
        createLineItem({ quantity: 1, rate: 300 }),
      ],
      discounts: [createDiscount({ value: 10, type: "percentage" })],
    });
    const totals = computeTotals(inv);
    // subtotal 400, 10% off = 40
    expect(totals.invoiceDiscountTotal).toBe(40);
    expect(totals.total).toBe(360);
    const itemTotals = Object.values(totals.items).reduce((s, i) => s + i.net, 0);
    expect(itemTotals).toBeCloseTo(360, 6);
  });

  it("fixed invoice discount does not exceed the subtotal", () => {
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 50 })],
      discounts: [createDiscount({ value: 10000, type: "fixed" })],
    });
    const totals = computeTotals(inv);
    expect(totals.invoiceDiscountTotal).toBe(50);
    expect(totals.total).toBe(0);
  });
});

describe("computeTotals — tax, exclusive", () => {
  it("single exclusive percentage tax adds on top", () => {
    const tax = createTax({ name: "GST", rate: 18, mode: "percentage", inclusive: false });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 100, taxIds: [tax.id] })],
      taxes: [tax],
    });
    const totals = computeTotals(inv);
    expect(totals.taxTotal).toBe(18);
    expect(totals.total).toBe(118);
  });

  it("multiple exclusive taxes (CGST + SGST) both apply and are itemised", () => {
    const cgst = createTax({ name: "CGST", rate: 9, inclusive: false });
    const sgst = createTax({ name: "SGST", rate: 9, inclusive: false });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 100, taxIds: [cgst.id, sgst.id] })],
      taxes: [cgst, sgst],
    });
    const totals = computeTotals(inv);
    expect(totals.taxTotal).toBe(18);
    expect(totals.total).toBe(118);
    expect(totals.taxSummary).toHaveLength(2);
    expect(totals.taxSummary.map((t) => t.amount).sort()).toEqual([9, 9]);
  });

  it("fixed-amount tax adds a flat charge regardless of base", () => {
    const flat = createTax({ name: "Environmental Fee", rate: 5, mode: "fixed", inclusive: false });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 10, rate: 10, taxIds: [flat.id] })],
      taxes: [flat],
    });
    const totals = computeTotals(inv);
    expect(totals.taxTotal).toBe(5);
    expect(totals.total).toBe(105);
  });
});

describe("computeTotals — tax, inclusive", () => {
  it("inclusive tax is extracted from the price, total stays the same as the item rate", () => {
    const tax = createTax({ name: "VAT", rate: 20, mode: "percentage", inclusive: true });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 120, taxIds: [tax.id] })],
      taxes: [tax],
    });
    const totals = computeTotals(inv);
    // 120 gross incl. 20% VAT -> net 100, tax 20, total remains 120
    expect(totals.total).toBe(120);
    expect(totals.taxTotal).toBe(20);
    expect(totals.taxableBase).toBe(100);
  });

  it("multiple inclusive taxes are apportioned and sum to the extracted total exactly", () => {
    const cgst = createTax({ name: "CGST", rate: 9, inclusive: true });
    const sgst = createTax({ name: "SGST", rate: 9, inclusive: true });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 118, taxIds: [cgst.id, sgst.id] })],
      taxes: [cgst, sgst],
    });
    const totals = computeTotals(inv);
    expect(totals.total).toBe(118);
    const sumParts = totals.taxSummary.reduce((s, t) => s + t.amount, 0);
    expect(sumParts).toBeCloseTo(totals.taxTotal, 6);
  });
});

describe("computeTotals — discounts and tax interaction", () => {
  it("tax is charged on the discounted amount, not the pre-discount amount", () => {
    const tax = createTax({ name: "GST", rate: 10, inclusive: false });
    const inv = createInvoice({
      items: [
        createLineItem({ quantity: 1, rate: 100, discountValue: 50, discountType: "percentage", taxIds: [tax.id] }),
      ],
      taxes: [tax],
    });
    const totals = computeTotals(inv);
    // net after discount = 50, tax = 5, total = 55
    expect(totals.total).toBe(55);
  });
});

describe("computeTotals — charges", () => {
  it("fixed non-taxable charge adds flat to the total", () => {
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 100 })],
      charges: [createCharge({ label: "Shipping", value: 15, type: "fixed", taxable: false })],
    });
    const totals = computeTotals(inv);
    expect(totals.chargeTotal).toBe(15);
    expect(totals.total).toBe(115);
  });

  it("taxable charge contributes to the tax total too", () => {
    const tax = createTax({ name: "GST", rate: 10, inclusive: false });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 100, taxIds: [tax.id] })],
      taxes: [tax],
      charges: [createCharge({ label: "Handling", value: 20, type: "fixed", taxable: true, taxIds: [tax.id] })],
    });
    const totals = computeTotals(inv);
    // item: 100 + 10 tax = 110. charge: 20 + 2 tax = 22. total 132
    expect(totals.total).toBe(132);
    expect(totals.taxTotal).toBe(12);
  });

  it("percentage charge is based on the discounted subtotal", () => {
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 200 })],
      discounts: [createDiscount({ value: 50, type: "fixed" })],
      charges: [createCharge({ label: "Service Fee", value: 10, type: "percentage", taxable: false })],
    });
    const totals = computeTotals(inv);
    // subtotal 200 - discount 50 = 150 base; 10% charge = 15
    expect(totals.chargeTotal).toBe(15);
    expect(totals.total).toBe(165);
  });
});

describe("computeTotals — rounding", () => {
  it("rounds to the configured decimal places by default", () => {
    const inv = invoiceWithItem(
      { quantity: 3, rate: 10.005 },
      {},
    );
    const totals = computeTotals(inv);
    expect(totals.total.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it("rounds the grand total to a whole unit when roundTotal is enabled, and reports the delta", () => {
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 100.4 })],
      settings: { ...createInvoice().settings, roundTotal: true },
    });
    const totals = computeTotals(inv);
    expect(totals.total).toBe(100);
    expect(totals.rounding).toBeCloseTo(-0.4, 6);
  });

  it("multi-line invoices with discount + multiple taxes still balance exactly", () => {
    const cgst = createTax({ name: "CGST", rate: 9, inclusive: false });
    const sgst = createTax({ name: "SGST", rate: 9, inclusive: false });
    const inv = createInvoice({
      items: [
        createLineItem({ quantity: 3, rate: 33.33, discountValue: 5, discountType: "percentage", taxIds: [cgst.id, sgst.id] }),
        createLineItem({ quantity: 7, rate: 12.99, taxIds: [cgst.id, sgst.id] }),
        createLineItem({ quantity: 1, rate: 999.5, discountValue: 100, discountType: "fixed", taxIds: [cgst.id] }),
      ],
      taxes: [cgst, sgst],
      discounts: [createDiscount({ value: 2, type: "percentage" })],
      charges: [createCharge({ label: "Shipping", value: 25, type: "fixed", taxable: true, taxIds: [sgst.id] })],
    });
    const totals = computeTotals(inv);
    expect(Number.isFinite(totals.total)).toBe(true);
    // Sum of computed item totals + charges (incl. their tax) must equal the grand total
    // when rounding is off (default), within floating display precision.
    const itemSum = Object.values(totals.items).reduce((s, i) => s + i.total, 0);
    expect(itemSum + totals.chargeTotal).toBeCloseTo(totals.total, 6);
  });
});

describe("computeTotals — malformed input resilience", () => {
  it("unknown tax id on a line is ignored rather than throwing", () => {
    const inv = invoiceWithItem({ quantity: 1, rate: 100, taxIds: ["does-not-exist"] });
    const totals = computeTotals(inv);
    expect(totals.total).toBe(100);
  });

  it("NaN quantity/rate does not propagate NaN into the total", () => {
    const inv = invoiceWithItem({ quantity: NaN, rate: 100 });
    const totals = computeTotals(inv);
    expect(Number.isFinite(totals.total)).toBe(true);
  });

  it("empty items array yields all-zero totals", () => {
    const inv = createInvoice({ items: [] });
    const totals = computeTotals(inv);
    expect(totals.total).toBe(0);
    expect(totals.subtotal).toBe(0);
  });

  it("duplicate tax ids on a line are only applied once", () => {
    const tax = createTax({ name: "GST", rate: 10, inclusive: false });
    const inv = createInvoice({
      items: [createLineItem({ quantity: 1, rate: 100, taxIds: [tax.id, tax.id] })],
      taxes: [tax],
    });
    const totals = computeTotals(inv);
    expect(totals.taxTotal).toBe(10);
  });
});

describe("computeTotals — amount in words", () => {
  it("renders a non-empty words string for the total", () => {
    const inv = invoiceWithItem({ quantity: 1, rate: 1234.56 }, { invoice: { ...createInvoice().invoice, currency: "USD" } });
    const totals = computeTotals(inv);
    expect(totals.amountInWords.length).toBeGreaterThan(0);
    expect(totals.amountInWords).toContain("Dollars");
  });
});
