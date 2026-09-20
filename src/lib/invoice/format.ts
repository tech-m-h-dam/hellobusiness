/**
 * Locale/format-aware presentation helpers, kept separate from calculations.ts
 * (which only ever deals in numbers) so the two concerns don't tangle.
 */
import type { InvoiceSettings } from "./types";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO (yyyy-mm-dd) date string per the invoice's configured date format. */
export function formatInvoiceDate(
  iso: string | undefined,
  format: InvoiceSettings["dateFormat"],
): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  switch (format) {
    case "dd/MM/yyyy":
      return `${dd}/${mm}/${y}`;
    case "MM/dd/yyyy":
      return `${mm}/${dd}/${y}`;
    case "d MMM yyyy":
      return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
    default:
      return `${y}-${mm}-${dd}`;
  }
}
