/**
 * "Amount in words" — a conventional line on many invoice formats (especially
 * GST/tax invoices), e.g. "Three Thousand Four Hundred and Fifty Rupees Only".
 *
 * Uses the international (thousand/million/billion) scale for every currency.
 * Indian invoices conventionally use the lakh/crore scale instead; we keep the
 * international scale everywhere for consistency and because it is universally
 * understood, and note this as a known simplification rather than special-casing
 * one currency's grouping in a generic engine.
 */

const ONES = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) {
    if (rest < 20) parts.push(ONES[rest]);
    else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      parts.push(ones ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens]);
    }
  }
  return parts.join(" ");
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const groups: string[] = [];
  let remaining = n;
  let scaleIndex = 0;
  while (remaining > 0) {
    const group = remaining % 1000;
    if (group) {
      const words = threeDigitsToWords(group);
      groups.unshift(SCALES[scaleIndex] ? `${words} ${SCALES[scaleIndex]}` : words);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }
  return groups.join(" ");
}

/** Best-effort currency name for the words line; falls back to the ISO code. */
function currencyUnitName(currency: string): { major: string; minor: string } {
  const table: Record<string, { major: string; minor: string }> = {
    USD: { major: "Dollars", minor: "Cents" },
    EUR: { major: "Euros", minor: "Cents" },
    GBP: { major: "Pounds", minor: "Pence" },
    INR: { major: "Rupees", minor: "Paise" },
    AUD: { major: "Australian Dollars", minor: "Cents" },
    CAD: { major: "Canadian Dollars", minor: "Cents" },
    JPY: { major: "Yen", minor: "" },
    AED: { major: "Dirhams", minor: "Fils" },
    SGD: { major: "Singapore Dollars", minor: "Cents" },
  };
  return table[currency] ?? { major: currency, minor: "Cents" };
}

/** Render a decimal amount as words, e.g. `amountToWords(1234.5, "USD")`. */
export function amountToWords(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const { major, minor } = currencyUnitName(currency);
  const wholeUnits = Math.floor(safe);
  const fraction = Math.round((safe - wholeUnits) * 100);

  const sign = amount < 0 ? "Minus " : "";
  const wholeWords = `${integerToWords(wholeUnits)} ${major}`;
  if (!minor || fraction === 0) return `${sign}${wholeWords} Only`;

  return `${sign}${wholeWords} and ${integerToWords(fraction)} ${minor} Only`;
}
