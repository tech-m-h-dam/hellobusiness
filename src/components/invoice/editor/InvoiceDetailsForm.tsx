"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { CURRENCIES, createCustomField } from "@/lib/invoice/defaults";
import type { InvoiceSettings } from "@/lib/invoice/types";

/** Locales offered for number, date and currency formatting. */
const LOCALES = [
  { value: "en-US", label: "English (US) — 1,234.56" },
  { value: "en-GB", label: "English (UK) — 1,234.56" },
  { value: "en-IN", label: "English (India) — 1,23,456.78" },
  { value: "de-DE", label: "German — 1.234,56" },
  { value: "fr-FR", label: "French — 1 234,56" },
  { value: "es-ES", label: "Spanish — 1.234,56" },
];

const DATE_FORMATS: { value: InvoiceSettings["dateFormat"]; label: string }[] = [
  { value: "d MMM yyyy", label: "20 Sep 2026" },
  { value: "dd/MM/yyyy", label: "20/09/2026" },
  { value: "MM/dd/yyyy", label: "09/20/2026" },
  { value: "yyyy-MM-dd", label: "2026-09-20" },
];

export function InvoiceDetailsForm() {
  const meta = useInvoiceEditor((s) => s.invoice.invoice);
  const settings = useInvoiceEditor((s) => s.invoice.settings);
  const customFields = useInvoiceEditor((s) => s.invoice.customFields);
  const update = useInvoiceEditor((s) => s.update);

  const set = <K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) =>
    update((inv) => ({ ...inv, invoice: { ...inv.invoice, [key]: value } }));

  const setSetting = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) =>
    update((inv) => ({ ...inv, settings: { ...inv.settings, [key]: value } }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Document title" htmlFor="inv-title" hint="e.g. Invoice, Tax Invoice, Proforma">
          <Input id="inv-title" value={meta.documentTitle} onChange={(e) => set("documentTitle", e.target.value)} />
        </Field>
        <Field label="Invoice number" htmlFor="inv-number" required>
          <Input id="inv-number" value={meta.number} onChange={(e) => set("number", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Invoice date" htmlFor="inv-date" required>
          <Input id="inv-date" type="date" value={meta.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Due date" htmlFor="inv-due">
          <Input id="inv-due" type="date" value={meta.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Currency" htmlFor="inv-currency">
          <Select value={meta.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger id="inv-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Payment terms" htmlFor="inv-terms">
          <Input
            id="inv-terms"
            value={meta.paymentTerms ?? ""}
            onChange={(e) => set("paymentTerms", e.target.value)}
            placeholder="Due within 15 days"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="PO number" htmlFor="inv-po">
          <Input id="inv-po" value={meta.purchaseOrder ?? ""} onChange={(e) => set("purchaseOrder", e.target.value)} />
        </Field>
        <Field label="Reference" htmlFor="inv-ref">
          <Input id="inv-ref" value={meta.reference ?? ""} onChange={(e) => set("reference", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Number & date format" htmlFor="inv-locale" hint="Controls grouping and decimal separators">
          <Select value={meta.locale} onValueChange={(v) => set("locale", v)}>
            <SelectTrigger id="inv-locale">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date style" htmlFor="inv-datefmt">
          <Select
            value={settings.dateFormat}
            onValueChange={(v) => setSetting("dateFormat", v as InvoiceSettings["dateFormat"])}
          >
            <SelectTrigger id="inv-datefmt">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Decimal places" htmlFor="inv-decimals" hint="0 for whole-unit currencies such as JPY">
          <Input
            id="inv-decimals"
            type="number"
            min={0}
            max={4}
            value={settings.decimals}
            onChange={(e) => setSetting("decimals", Math.max(0, Math.min(4, Number(e.target.value) || 0)))}
          />
        </Field>
        <Field label="Status" htmlFor="inv-status" hint="For your own records; not printed">
          <Select
            value={meta.status ?? "draft"}
            onValueChange={(v) => set("status", v as NonNullable<typeof meta.status>)}
          >
            <SelectTrigger id="inv-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Custom fields ---------------------------------------------------- */}
      <div className="rounded-lg border border-ink-200 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink-800">Custom fields</p>
            <p className="text-[12px] text-ink-500">Project name, client ID, vehicle number, service period…</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              update((inv) => ({ ...inv, customFields: [...inv.customFields, createCustomField()] }))
            }
          >
            <Plus /> Add
          </Button>
        </div>

        {customFields.length > 0 && (
          <ul className="mt-3 space-y-2">
            {customFields.map((field) => (
              <li key={field.id} className="flex items-center gap-2">
                <Input
                  aria-label="Field label"
                  className="max-w-[40%]"
                  placeholder="Label"
                  value={field.label}
                  onChange={(e) =>
                    update((inv) => ({
                      ...inv,
                      customFields: inv.customFields.map((f) =>
                        f.id === field.id ? { ...f, label: e.target.value } : f,
                      ),
                    }))
                  }
                />
                <Input
                  aria-label="Field value"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) =>
                    update((inv) => ({
                      ...inv,
                      customFields: inv.customFields.map((f) =>
                        f.id === field.id ? { ...f, value: e.target.value } : f,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${field.label || "custom field"}`}
                  onClick={() =>
                    update((inv) => ({
                      ...inv,
                      customFields: inv.customFields.filter((f) => f.id !== field.id),
                    }))
                  }
                >
                  <Trash2 className="text-ink-400" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
