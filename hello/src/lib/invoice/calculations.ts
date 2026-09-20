/**
 * The invoice calculation engine.
 *
 * Pure functions over the invoice model — no React, no DOM, no I/O — so the
 * totals can be unit tested exhaustively and reused by the preview, the PDF
 * renderer and any future server-side consumer without divergence.
 *
 * Order of operations
 * -------------------
 *   quantity x rate                  -> line gross
 *   - line discount                  -> line net
 *   - pro-rata share of the invoice discount
 *   = discounted price (may still contain inclusive tax)
 *   - inclusive tax extracted        -> line taxable value ("net")
 *   + all tax (inclusive + exclusive), each rounded to the display precision
 *   = line total  (net + tax, exactly — see below)
 *   sum of line totals + charges (+ tax on taxable charges)
 *   +/- optional whole-unit rounding -> grand total
 *
 * Rounding strategy — round-per-line, not round-the-aggregate
 * -------------------------------------------------------------
 * Every amount that ends up on screen (line net, each tax part, line total,
 * charge amount) is rounded to the currency's display precision *before* it is
 * added into any invoice-level sum. The invoice-level "Subtotal", "Tax" and
 * "Total" figures are then literal sums of those already-rounded numbers.
 *
 * This is deliberate: it guarantees `net + tax = total` on every line, and
 * `sum(line totals) + charges = grand total` on the invoice, so a customer who
 * adds up the printed rows with a calculator gets the printed total. The
 * alternative — carrying full precision through every step and rounding only
 * the final aggregate — is arithmetically "more accurate" but can make a real,
 * printed invoice fail to add up by a cent, which looks like a bug to anyone
 * checking it by hand. All intermediate work still happens in integer
 * micro-units (see money.ts) so the rounding itself is never a source of float
 * error; only the *point* at which we round is chosen for additive consistency.
 *
 * The invoice-level discount is allocated across lines *before* tax rather than
 * subtracted from the post-tax total. Tax authorities charge tax on the
 * discounted consideration, so applying it afterwards would overstate the tax
 * due on any invoice that carries both a discount and a tax.
 */

import type {
  Charge,
  ComputedItem,
  ComputedTotals,
  Discount,
  Invoice,
  InvoiceItem,
  Tax,
} from "./types";
import {
  MICRO,
  type Micro,
  fromMicro,
  mulMicro,
  percentOfMicro,
  roundHalfAwayFromZero,
  taxIncludedInMicro,
  toMicro,
} from "./money";
import { amountToWords } from "./words";

/**
 * Resolve the tax definitions referenced by a line, skipping unknown/duplicate
 * ids and applying any per-line rate override.
 *
 * The override is what lets one invoice carry several GST slabs: the CGST/SGST
 * definitions are shared, while each line states the rate that applies to it.
 */
function resolveTaxes(
  taxIds: string[],
  taxes: Tax[],
  overrides?: Record<string, number>,
): Tax[] {
  if (!taxIds?.length) return [];
  const byId = new Map(taxes.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const out: Tax[] = [];
  for (const id of taxIds) {
    if (seen.has(id)) continue; // a duplicated id would otherwise charge tax twice
    seen.add(id);
    const tax = byId.get(id);
    if (!tax) continue;
    const override = overrides?.[id];
    out.push(
      typeof override === "number" && Number.isFinite(override) ? { ...tax, rate: override } : tax,
    );
  }
  return out;
}

/** quantity x rate, before discounts. */
function lineGross(item: InvoiceItem): Micro {
  return mulMicro(toMicro(item.rate), item.quantity ?? 0);
}

/** The discount on a single line, never exceeding (or flipping the sign of) the line. */
function lineDiscount(item: InvoiceItem, gross: Micro): Micro {
  const value = item.discountValue ?? 0;
  if (!value) return 0;
  const raw =
    item.discountType === "percentage" ? percentOfMicro(gross, value) : toMicro(value);
  if (gross >= 0) return Math.max(0, Math.min(raw, gross));
  return Math.min(0, Math.max(raw, gross));
}

type TaxPart = { taxId: string; name: string; rate: number; amount: Micro };

/**
 * Split a base amount into its taxable value and its tax parts, rounded to
 * `decimals` as they are produced. Inclusive taxes are extracted from the base
 * as a group and apportioned between the individual inclusive taxes by rate
 * share; exclusive taxes are then charged on the taxable value that remains.
 * A remainder-absorption pass keeps every group of parts summing exactly to
 * its rounded total, so there is never a stray fractional cent.
 */
function splitTax(
  base: Micro,
  taxes: Tax[],
  decimals: number,
): { taxableValue: Micro; taxTotal: Micro; parts: TaxPart[] } {
  const step = MICRO / 10 ** decimals;
  const round = (v: Micro) => roundHalfAwayFromZero(v / step) * step;

  const inclusive = taxes.filter((t) => t.inclusive && t.mode === "percentage");
  const exclusive = taxes.filter((t) => !t.inclusive || t.mode === "fixed");

  const parts: TaxPart[] = [];

  // --- Inclusive taxes: extract from the base, apportion, then round the group.
  let containedRaw = 0;
  if (inclusive.length) {
    const combinedRate = inclusive.reduce((sum, t) => sum + (t.rate || 0), 0);
    containedRaw = taxIncludedInMicro(base, combinedRate);
  }
  const taxableValue = round(base - containedRaw);
  // The rounded inclusive-tax pool is whatever the rounded taxable value implies,
  // not a second independent rounding of `containedRaw` — this is what keeps
  // taxableValue + inclusiveTaxPool === (rounded) discounted price.
  const inclusivePool = round(base) - taxableValue;

  if (inclusive.length) {
    const combinedRate = inclusive.reduce((sum, t) => sum + (t.rate || 0), 0);
    let allocated = 0;
    inclusive.forEach((t, i) => {
      const isLast = i === inclusive.length - 1;
      const amount = isLast
        ? inclusivePool - allocated
        : round((inclusivePool * (t.rate || 0)) / (combinedRate || 1));
      allocated += amount;
      parts.push({ taxId: t.id, name: t.name, rate: t.rate, amount });
    });
  }

  // --- Exclusive taxes: charged on the (rounded) taxable value.
  let exclusiveTotal: Micro = 0;
  for (const t of exclusive) {
    const amount =
      t.mode === "fixed" ? round(toMicro(t.rate)) : round(percentOfMicro(taxableValue, t.rate || 0));
    exclusiveTotal += amount;
    parts.push({ taxId: t.id, name: t.name, rate: t.rate, amount });
  }

  const taxTotal = inclusivePool + exclusiveTotal;
  return { taxableValue, taxTotal, parts };
}

/** The invoice-level discount as a micro amount against a given subtotal. */
function invoiceDiscountAmount(discounts: Discount[], subtotal: Micro): Micro {
  let total = 0;
  for (const d of discounts ?? []) {
    if (!d.value) continue;
    total +=
      d.type === "percentage" ? percentOfMicro(subtotal, d.value) : toMicro(d.value);
  }
  if (subtotal >= 0) return Math.max(0, Math.min(total, subtotal));
  return Math.min(0, Math.max(total, subtotal));
}

/** A charge's base amount (percentage charges are taken against the discounted subtotal). */
function chargeAmount(charge: Charge, base: Micro): Micro {
  if (!charge.value) return 0;
  return charge.type === "percentage"
    ? percentOfMicro(base, charge.value)
    : toMicro(charge.value);
}

/**
 * Compute every derived amount on an invoice.
 *
 * Deterministic and total: malformed input (missing arrays, NaN quantities,
 * unknown tax ids) yields zeros rather than throwing, because this runs on every
 * keystroke in the editor and must never take the preview down.
 */
export function computeTotals(invoice: Invoice): ComputedTotals {
  const items = invoice.items ?? [];
  const taxes = invoice.taxes ?? [];
  const decimals = invoice.settings?.decimals ?? 2;
  const step = MICRO / 10 ** decimals;
  const round = (v: Micro) => roundHalfAwayFromZero(v / step) * step;

  /* --- 1. Line gross, line discount, line net (raw, for allocation basis) - */
  const grossById = new Map<string, Micro>();
  const itemDiscountById = new Map<string, Micro>();
  const netById = new Map<string, Micro>();

  let rawSubtotal: Micro = 0;

  for (const item of items) {
    const gross = lineGross(item);
    const discount = lineDiscount(item, gross);
    const net = gross - discount;
    grossById.set(item.id, gross);
    itemDiscountById.set(item.id, discount);
    netById.set(item.id, net);
    rawSubtotal += net;
  }

  /* --- 2. Invoice-level discount, allocated pro rata across raw line nets - */
  const invoiceDiscount = invoiceDiscountAmount(invoice.discounts ?? [], rawSubtotal);

  const allocatedDiscount = new Map<string, Micro>();
  if (invoiceDiscount !== 0 && rawSubtotal !== 0) {
    let allocated = 0;
    items.forEach((item, i) => {
      const net = netById.get(item.id) ?? 0;
      const isLast = i === items.length - 1;
      const share = isLast
        ? invoiceDiscount - allocated
        : roundHalfAwayFromZero((invoiceDiscount * net) / rawSubtotal);
      allocated += share;
      allocatedDiscount.set(item.id, share);
    });
  }

  /* --- 3. Per line: extract tax, round, and build the line total from the -- */
  /*        already-rounded net + tax so it is additive by construction. ---- */
  const computedItems: Record<string, ComputedItem> = {};
  /**
   * Tax summary buckets.
   *
   * Keyed by tax id *and* rate, not by id alone: with per-line rate overrides
   * one invoice can carry several GST slabs against the same CGST definition,
   * and those have to be reported as separate lines ("CGST 9%", "CGST 14%")
   * rather than silently merged under whichever rate happened to appear first.
   */
  const taxTotals = new Map<string, TaxPart>();
  const bucketKey = (part: TaxPart) => `${part.taxId}@${part.rate}`;

  let subtotal: Micro = 0; // sum of rounded per-line taxable values
  let itemDiscountTotal: Micro = 0;
  let taxTotal: Micro = 0; // sum of rounded per-line tax
  let lineTotalSum: Micro = 0; // sum of rounded per-line totals

  for (const item of items) {
    const gross = grossById.get(item.id) ?? 0;
    const itemDiscount = itemDiscountById.get(item.id) ?? 0;
    const net = netById.get(item.id) ?? 0;
    const share = allocatedDiscount.get(item.id) ?? 0;
    const discountedNet = net - share;

    const applicable = resolveTaxes(item.taxIds ?? [], taxes, item.taxRates);
    const { taxableValue, taxTotal: lineTax, parts } = splitTax(
      discountedNet,
      applicable,
      decimals,
    );
    const lineTotal = taxableValue + lineTax;

    for (const part of parts) {
      const key = bucketKey(part);
      const existing = taxTotals.get(key);
      if (existing) existing.amount += part.amount;
      else taxTotals.set(key, { ...part });
    }

    subtotal += taxableValue;
    itemDiscountTotal += round(itemDiscount);
    taxTotal += lineTax;
    lineTotalSum += lineTotal;

    computedItems[item.id] = {
      id: item.id,
      gross: fromMicro(round(gross)),
      discount: fromMicro(round(itemDiscount)),
      net: fromMicro(taxableValue),
      taxTotal: fromMicro(lineTax),
      taxBreakdown: parts.map((p) => ({
        taxId: p.taxId,
        name: p.name,
        rate: p.rate,
        amount: fromMicro(p.amount),
      })),
      total: fromMicro(lineTotal),
    };
  }

  /* --- 4. Charges (and tax on taxable charges), rounded the same way ------ */
  let chargeTotal: Micro = 0;
  // `subtotal` is already net of the invoice-level discount (it was allocated
  // per line in step 2, before tax), so percentage charges apply to it as-is —
  // subtracting the discount again here would double count it.
  const chargeBase = subtotal;

  for (const charge of invoice.charges ?? []) {
    const amount = round(chargeAmount(charge, chargeBase));
    chargeTotal += amount;

    if (charge.taxable && charge.taxIds?.length) {
      const applicable = resolveTaxes(charge.taxIds, taxes);
      const { parts, taxTotal: chargeTax } = splitTax(amount, applicable, decimals);
      // Charges only ever carry exclusive tax in practice (an inclusive tax on
      // a fee would silently reduce the fee), but splitTax handles both safely.
      for (const part of parts) {
        const key = bucketKey(part);
        const existing = taxTotals.get(key);
        if (existing) existing.amount += part.amount;
        else taxTotals.set(key, { ...part });
      }
      taxTotal += chargeTax;
      chargeTotal += chargeTax;
    }
  }

  /* --- 5. Grand total: sum of already-rounded parts, so it is exact ------- */
  let total = lineTotalSum + chargeTotal;

  let rounding: Micro = 0;
  if (invoice.settings?.roundTotal) {
    const wholeUnit = roundHalfAwayFromZero(total / MICRO) * MICRO;
    rounding = wholeUnit - total;
    total = wholeUnit;
  }

  const currency = invoice.invoice?.currency ?? "USD";
  const totalDecimal = fromMicro(total);

  return {
    items: computedItems,
    subtotal: fromMicro(subtotal),
    itemDiscountTotal: fromMicro(itemDiscountTotal),
    invoiceDiscountTotal: fromMicro(round(invoiceDiscount)),
    // The base taxes/charges were computed against: subtotal after the
    // invoice-level discount, before tax. Equal to `subtotal` per line item
    // when there is no invoice-level discount.
    taxableBase: fromMicro(chargeBase),
    chargeTotal: fromMicro(chargeTotal),
    taxTotal: fromMicro(taxTotal),
    taxSummary: [...taxTotals.values()]
      .filter((t) => t.amount !== 0)
      .map((t) => ({
        taxId: t.taxId,
        name: t.name,
        rate: t.rate,
        amount: fromMicro(t.amount),
      })),
    rounding: fromMicro(rounding),
    total: totalDecimal,
    amountInWords: amountToWords(totalDecimal, currency),
  };
}

/** Convenience: the balance still owed once payments/advances are deducted. */
export function computeBalanceDue(totals: ComputedTotals, amountPaid = 0): number {
  return fromMicro(toMicro(totals.total) - toMicro(amountPaid));
}
