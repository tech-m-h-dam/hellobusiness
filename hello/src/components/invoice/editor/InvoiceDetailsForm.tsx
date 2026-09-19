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

export function InvoiceDetailsForm() {
  const meta = useInvoiceEditor((s) => s.invoice.invoice);
  const customFields = useInvoiceEditor((s) => s.invoice.customFields);
  const update = useInvoiceEditor((s) => s.update);

  const set = <K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) =>
    update((inv) => ({ ...inv, invoice: { ...inv.invoice, [key]: value } }));

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
