"use client";

/**
 * Template selection and document customization.
 *
 * Selecting a template only ever sets `templateId` and merges that template's
 * styling preset — see applyTemplatePreset(). Business data, customer data,
 * items, taxes and every other field are untouched, so users can try templates
 * freely without losing work (spec section 15).
 */
import { Check } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { LabelsPanel } from "./LabelsPanel";
import { TEMPLATES, applyTemplatePreset } from "@/lib/invoice/templates";
import { track } from "@/lib/analytics/track";
import type { ColumnKey, InvoiceSettings } from "@/lib/invoice/types";

const COLUMN_TOGGLES: { key: ColumnKey; label: string }[] = [
  { key: "index", label: "Row number" },
  { key: "image", label: "Item images" },
  { key: "sku", label: "SKU" },
  { key: "hsn", label: "HSN/SAC" },
  { key: "quantity", label: "Quantity" },
  { key: "unit", label: "Unit" },
  { key: "rate", label: "Rate" },
  { key: "discount", label: "Discount" },
  { key: "tax", label: "Tax" },
];

const SECTION_TOGGLES: { key: keyof InvoiceSettings; label: string }[] = [
  { key: "showDueDate", label: "Due date" },
  { key: "showShipping", label: "Shipping address" },
  { key: "showTaxSummary", label: "Tax breakdown" },
  { key: "showPaymentDetails", label: "Payment details" },
  { key: "showPageNumbers", label: "Page numbers (PDF)" },
  { key: "showFooter", label: "Footer line" },
];

export function DesignPanel() {
  const templateId = useInvoiceEditor((s) => s.invoice.templateId);
  const settings = useInvoiceEditor((s) => s.invoice.settings);
  const update = useInvoiceEditor((s) => s.update);

  const setSetting = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) =>
    update((inv) => ({ ...inv, settings: { ...inv.settings, [key]: value } }));

  function selectTemplate(id: string) {
    update((inv) => ({
      ...inv,
      templateId: id,
      settings: applyTemplatePreset(inv.settings, id),
    }));
    track("template_selected");
  }

  return (
    <div className="space-y-6">
      {/* Template gallery -------------------------------------------------- */}
      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-ink-800">Template</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const active = t.id === templateId;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  aria-pressed={active}
                  className={`w-full rounded-lg border p-2 text-left transition-all ${
                    active
                      ? "border-brand-600 ring-2 ring-brand-600/20"
                      : "border-ink-200 hover:border-ink-300"
                  }`}
                >
                  {/* Miniature of the layout, drawn from the preset's own colours. */}
                  <span
                    className="mb-1.5 flex h-12 w-full flex-col justify-between overflow-hidden rounded"
                    style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
                    aria-hidden="true"
                  >
                    <span className="block h-3 w-full" style={{ backgroundColor: t.settings.primaryColor }} />
                    <span className="flex flex-col gap-0.5 px-1 pb-1">
                      <span className="block h-0.5 w-3/4 rounded bg-ink-200" />
                      <span className="block h-0.5 w-full rounded bg-ink-100" />
                      <span className="block h-0.5 w-1/2 rounded bg-ink-100" />
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-1">
                    <span className="truncate text-[12px] font-medium text-ink-800">{t.name}</span>
                    {active && <Check className="size-3.5 shrink-0 text-brand-600" />}
                  </span>
                  <span className="block text-[10.5px] text-ink-500">{t.category}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Branding ---------------------------------------------------------- */}
      <section className="space-y-3">
        <h3 className="text-[13px] font-semibold text-ink-800">Branding</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary colour" htmlFor="set-primary">
            <div className="flex gap-2">
              <input
                id="set-primary"
                type="color"
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-300 bg-white p-1"
                value={settings.primaryColor}
                onChange={(e) => setSetting("primaryColor", e.target.value)}
              />
              <Input value={settings.primaryColor} onChange={(e) => setSetting("primaryColor", e.target.value)} />
            </div>
          </Field>
          <Field label="Logo position" htmlFor="set-logopos">
            <Select
              value={settings.logoPosition}
              onValueChange={(v) => setSetting("logoPosition", v as "left" | "center" | "right")}
            >
              <SelectTrigger id="set-logopos">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      {/* Typography & page -------------------------------------------------- */}
      <section className="space-y-3">
        <h3 className="text-[13px] font-semibold text-ink-800">Typography &amp; page</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Font" htmlFor="set-font">
            <Select
              value={settings.fontFamily}
              onValueChange={(v) => setSetting("fontFamily", v as InvoiceSettings["fontFamily"])}
            >
              <SelectTrigger id="set-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Helvetica">Helvetica (sans-serif)</SelectItem>
                <SelectItem value="Times-Roman">Times (serif)</SelectItem>
                <SelectItem value="Courier">Courier (monospace)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Page size" htmlFor="set-page">
            <Select
              value={settings.pageSize}
              onValueChange={(v) => setSetting("pageSize", v as "A4" | "Letter")}
            >
              <SelectTrigger id="set-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Body text size" htmlFor="set-base">
            <Input
              id="set-base"
              type="number"
              min={6}
              max={24}
              value={settings.baseFontSize}
              onChange={(e) => setSetting("baseFontSize", Number(e.target.value) || 10)}
            />
          </Field>
          <Field label="Table text size" htmlFor="set-table">
            <Input
              id="set-table"
              type="number"
              min={6}
              max={20}
              step="0.5"
              value={settings.tableFontSize}
              onChange={(e) => setSetting("tableFontSize", Number(e.target.value) || 9.5)}
            />
          </Field>
          <Field label="Page margin" htmlFor="set-margin">
            <Input
              id="set-margin"
              type="number"
              min={0}
              max={80}
              value={settings.margin}
              onChange={(e) => setSetting("margin", Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field label="Table style" htmlFor="set-tablestyle">
          <Select
            value={settings.tableStyle}
            onValueChange={(v) => setSetting("tableStyle", v as InvoiceSettings["tableStyle"])}
          >
            <SelectTrigger id="set-tablestyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bordered">Bordered</SelectItem>
              <SelectItem value="striped">Striped rows</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </section>

      {/* Labels ------------------------------------------------------------ */}
      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-ink-800">Labels &amp; wording</h3>
        <LabelsPanel />
      </section>

      {/* Visibility -------------------------------------------------------- */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold text-ink-800">Columns</h3>
        <ul className="grid gap-1 sm:grid-cols-2">
          {COLUMN_TOGGLES.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-ink-50">
              <Label htmlFor={`col-${key}`} className="cursor-pointer">{label}</Label>
              <Switch
                id={`col-${key}`}
                checked={settings.showColumn[key]}
                onCheckedChange={(checked) =>
                  setSetting("showColumn", { ...settings.showColumn, [key]: checked })
                }
              />
            </li>
          ))}
        </ul>

        <h3 className="pt-2 text-[13px] font-semibold text-ink-800">Sections</h3>
        <ul className="grid gap-1 sm:grid-cols-2">
          {SECTION_TOGGLES.map(({ key, label }) => (
            <li key={String(key)} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-ink-50">
              <Label htmlFor={`sec-${String(key)}`} className="cursor-pointer">{label}</Label>
              <Switch
                id={`sec-${String(key)}`}
                checked={Boolean(settings[key])}
                onCheckedChange={(checked) => setSetting(key, checked as InvoiceSettings[typeof key])}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
