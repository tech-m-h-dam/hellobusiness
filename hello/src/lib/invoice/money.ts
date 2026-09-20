/**
 * Decimal-safe money arithmetic.
 *
 * Invoice totals must be reproducible: the same inputs must always produce the
 * same total, and the parts must always add up to the whole. Plain IEEE-754
 * arithmetic does not give us that (`0.1 + 0.2 !== 0.3`, `1.005 * 100 = 100.49999`),
 * so every amount is carried as an *integer* number of micro-units (1e-6) and is
 * rounded to an integer after every operation. Rounding to the currency's minor
 * unit happens only at presentation boundaries.
 *
 * Range: micro-units keep us inside Number.MAX_SAFE_INTEGER up to ~9,007,199,254
 * units of currency, which is far beyond any realistic invoice total.
 */

export const MICRO = 1_000_000;

/** An amount of money as an integer count of micro-units. */
export type Micro = number;

/** Largest magnitude we accept, in whole currency units. */
const MAX_UNITS = 1e9;

/**
 * Round half away from zero.
 *
 * `Math.round` rounds half *up* (toward +Infinity), which makes negative amounts
 * asymmetric: `Math.round(-0.5) === -0` but `Math.round(0.5) === 1`. Credit notes
 * and negative line items must round the same way as positive ones.
 */
export function roundHalfAwayFromZero(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Convert a user-supplied decimal into micro-units. */
export function toMicro(value: number | string | null | undefined): Micro {
  const n = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);
  if (!Number.isFinite(n)) return 0;
  const clamped = Math.max(-MAX_UNITS, Math.min(MAX_UNITS, n));
  return roundHalfAwayFromZero(clamped * MICRO);
}

/** Convert micro-units back to a decimal number. */
export function fromMicro(value: Micro): number {
  return value / MICRO;
}

export function addMicro(...values: Micro[]): Micro {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function subMicro(a: Micro, b: Micro): Micro {
  return a - b;
}

/**
 * Multiply an amount by a plain (non-money) factor such as a quantity.
 * The factor itself is quantised to 1e-6 first so that a quantity typed as
 * `0.1 + 0.2` cannot leak float noise into the total.
 */
export function mulMicro(amount: Micro, factor: number): Micro {
  if (!Number.isFinite(factor)) return 0;
  const quantised = roundHalfAwayFromZero(factor * MICRO) / MICRO;
  return roundHalfAwayFromZero(amount * quantised);
}

/** Take `percent`% of an amount. */
export function percentOfMicro(amount: Micro, percent: number): Micro {
  if (!Number.isFinite(percent)) return 0;
  const quantised = roundHalfAwayFromZero(percent * MICRO);
  return roundHalfAwayFromZero((amount * quantised) / (100 * MICRO));
}

/**
 * Extract the tax contained *within* a gross amount (tax-inclusive pricing).
 *
 *   net = gross / (1 + rate/100)      tax = gross - net
 *
 * Derived this way rather than as `gross * rate/100` so that net + tax is
 * guaranteed to equal gross exactly, with no residual cent.
 */
export function taxIncludedInMicro(gross: Micro, percent: number): Micro {
  if (!Number.isFinite(percent) || percent <= -100) return 0;
  const net = roundHalfAwayFromZero((gross * 100 * MICRO) / ((100 + percent) * MICRO));
  return gross - net;
}

/** Round an amount to `dp` decimal places, staying in micro-units. */
export function roundMicroTo(amount: Micro, dp: number): Micro {
  const safeDp = Math.max(0, Math.min(6, Math.trunc(dp)));
  const step = MICRO / 10 ** safeDp;
  if (step <= 1) return amount;
  return roundHalfAwayFromZero(amount / step) * step;
}

/**
 * Format an amount for display.
 *
 * Currency rules (symbol, placement, digits, grouping) come from `Intl`, never
 * from a hardcoded table, so adding a currency or a locale needs no code change.
 * Falls back to a plain grouped number if the runtime rejects the currency code.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale = "en-US",
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {},
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...options,
    }).format(value);
  } catch {
    const digits = options.maximumFractionDigits ?? 2;
    return `${currency} ${value.toFixed(digits)}`;
  }
}

/** Format a micro-unit amount for display. */
export function formatMicro(amount: Micro, currency: string, locale = "en-US"): string {
  return formatMoney(fromMicro(amount), currency, locale);
}

/** How many minor-unit digits a currency uses (2 for USD, 0 for JPY, 3 for KWD). */
export function currencyDecimals(currency: string, locale = "en-US"): number {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).resolvedOptions();
    return parts.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}
