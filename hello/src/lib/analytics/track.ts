"use client";

/**
 * Privacy-preserving product analytics.
 *
 * Only event *names* and non-identifying counters are ever recorded. Invoice
 * contents — customer names, addresses, emails, phone numbers, bank details,
 * line items, totals — are never passed to this function, and the payload type
 * enforces that: properties are restricted to numbers, booleans and a small
 * set of enumerated strings (template ids, layout names), never free text.
 *
 * Loading is non-blocking and entirely optional: with no analytics id
 * configured this is a no-op, and nothing in the app's behaviour depends on it
 * (spec sections 47, 69, 88).
 */

export type AnalyticsEvent =
  | "invoice_started"
  | "invoice_completed"
  | "pdf_downloaded"
  | "pdf_failed"
  | "docx_downloaded"
  | "docx_failed"
  | "invoice_printed"
  | "template_selected"
  | "template_created"
  | "logo_uploaded"
  | "line_item_image_added"
  | "item_added"
  | "google_login"
  | "invoice_saved"
  | "saved_invoice_opened";

/** Only non-identifying, enumerable values — never invoice content. */
export type AnalyticsProps = Record<string, number | boolean | undefined> & {
  templateId?: never;
};

type WindowWithGtag = Window & {
  gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
};

export function track(event: AnalyticsEvent, props?: Record<string, number | boolean>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_ANALYTICS_ID) return;

  try {
    const w = window as WindowWithGtag;
    w.gtag?.("event", event, props);
  } catch {
    // Analytics must never break the app — a failed event is simply dropped.
  }
}
