"use client";

/**
 * Business (sender) details, including the logo upload.
 *
 * Form state note: the live editor binds inputs straight to the Zustand store
 * rather than going through React Hook Form. Every keystroke has to reach the
 * live preview, so an RHF-owned copy of the same data would be a second source
 * of truth for no gain. RHF + Zod are used where they earn their keep — the
 * discrete, submit-and-validate forms (save-to-account, contact). The invoice
 * itself is still validated with the same Zod schema at its real boundaries:
 * before an account save and before any API call (lib/invoice/validation.ts).
 */
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { ImageProcessingError, processLogoFile } from "@/lib/invoice/images";
import { track } from "@/lib/analytics/track";

export function BusinessForm() {
  const business = useInvoiceEditor((s) => s.invoice.business);
  const update = useInvoiceEditor((s) => s.update);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof business>(key: K, value: (typeof business)[K]) =>
    update((inv) => ({ ...inv, business: { ...inv.business, [key]: value } }));

  async function onLogoSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const processed = await processLogoFile(file);
      update((inv) => ({
        ...inv,
        business: { ...inv.business, logo: processed.src },
      }));
      track("logo_uploaded");
    } catch (err) {
      setError(
        err instanceof ImageProcessingError
          ? err.message
          : "That image couldn't be processed. Try a different file.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {business.logo ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- in-browser data URL */}
              <img
                src={business.logo}
                alt="Your business logo"
                className="size-20 rounded-lg border border-ink-200 object-contain p-1"
              />
              <button
                type="button"
                onClick={() => set("logo", undefined)}
                className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-ink-500 shadow ring-1 ring-ink-200 hover:text-red-600"
                aria-label="Remove logo"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink-300 text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              <span className="text-[10px] font-medium">Logo</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => void onLogoSelected(e.target.files?.[0])}
          />
        </div>

        <div className="flex-1 space-y-3">
          <Field label="Business name" htmlFor="biz-name">
            <Input
              id="biz-name"
              value={business.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Acme Design Studio"
            />
          </Field>
          {error && <p className="text-[12px] text-red-600" role="alert">{error}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email" htmlFor="biz-email">
          <Input
            id="biz-email"
            type="email"
            value={business.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="billing@acme.com"
          />
        </Field>
        <Field label="Phone" htmlFor="biz-phone">
          <Input
            id="biz-phone"
            value={business.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+1 555 010 1234"
          />
        </Field>
      </div>

      <Field label="Address" htmlFor="biz-addr1">
        <Input
          id="biz-addr1"
          value={business.addressLine1 ?? ""}
          onChange={(e) => set("addressLine1", e.target.value)}
          placeholder="Street address"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="City" htmlFor="biz-city">
          <Input id="biz-city" value={business.city ?? ""} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="State" htmlFor="biz-state">
          <Input id="biz-state" value={business.state ?? ""} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Postal code" htmlFor="biz-zip">
          <Input id="biz-zip" value={business.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Country" htmlFor="biz-country">
          <Input id="biz-country" value={business.country ?? ""} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field label="Website" htmlFor="biz-web">
          <Input id="biz-web" value={business.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="acme.com" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="GSTIN" htmlFor="biz-gstin" hint="For GST invoices (India)">
          <Input id="biz-gstin" value={business.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} />
        </Field>
        <Field label="Tax ID / VAT number" htmlFor="biz-taxid">
          <Input id="biz-taxid" value={business.taxId ?? ""} onChange={(e) => set("taxId", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
