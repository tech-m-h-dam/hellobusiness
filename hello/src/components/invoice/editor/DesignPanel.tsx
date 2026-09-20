"use client";

/**
 * Template selection and document customization.
 *
 * Selecting a template only ever sets `templateId` and merges that template's
 * styling preset — see applyTemplatePreset(). Business data, customer data,
 * items, taxes and every other field are untouched, so users can try templates
 * freely without losing work (spec section 15).
 */
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
import { TEMPLATES, applyTemplatePreset, getTemplate } from "@/lib/invoice/templates";
import { track } from "@/lib/analytics/track";
import type { ColumnKey, InvoiceSettings } from "@/lib/invoice/types";

const COLUMN_TOGGLES: { key: ColumnKey; label: string }[] = [
  { key: "index", label: "Row number" },
  { key: "image", label: "Item images" },
  { key: "description", label: "Description (own column)" },
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

  const activeTemplate = getTemplate(templateId);

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
      {/* Template ---------------------------------------------------------- */}
      <section>
        <Field
          label="Template"
          htmlFor="template-select"
          hint={`${TEMPLATES.length} templates — switching never changes what you've typed`}
        >
          {/*
           * A dropdown rather than a thumbnail grid: the grid pushed everything
           * else in this panel below the fold, and the preview beside it already
           * shows what the template looks like the moment it is chosen.
           */}
          <Select value={templateId} onValueChange={selectTemplate}>
            <SelectTrigger id="template-select" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: t.settings.primaryColor }}
                      aria-hidden="true"
                    />
                    <span>{t.name}</span>
                    <span className="text-[11px] text-ink-400">{t.category}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <p className="mt-1.5 text-[12px] text-ink-500">{activeTemplate.description}</p>
      </section>

      {/* Visibility — kept high in the panel: which columns and sections
          appear is the setting people reach for most, and it used to sit
          below the colour, type and page controls. */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold text-ink-900">Columns on the invoice</h3>
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

        <h3 className="pt-3 text-[13px] font-semibold text-ink-900">Sections on the invoice</h3>
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
          <Field label="Secondary colour" htmlFor="set-secondary" hint="Used by accents in some templates">
            <div className="flex gap-2">
              <input
                id="set-secondary"
                type="color"
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-300 bg-white p-1"
                value={settings.secondaryColor}
                onChange={(e) => setSetting("secondaryColor", e.target.value)}
              />
              <Input value={settings.secondaryColor} onChange={(e) => setSetting("secondaryColor", e.target.value)} />
            </div>
          </Field>
          <Field label="Text on colour" htmlFor="set-accent" hint="Text drawn over the accent colour">
            <div className="flex gap-2">
              <input
                id="set-accent"
                type="color"
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-300 bg-white p-1"
                value={settings.accentTextColor}
                onChange={(e) => setSetting("accentTextColor", e.target.value)}
              />
              <Input value={settings.accentTextColor} onChange={(e) => setSetting("accentTextColor", e.target.value)} />
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
          <Field label="Orientation" htmlFor="set-orient">
            <Select
              value={settings.orientation}
              onValueChange={(v) => setSetting("orientation", v as "portrait" | "landscape")}
            >
              <SelectTrigger id="set-orient">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
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
          <Field label="Heading size" htmlFor="set-heading">
            <Input
              id="set-heading"
              type="number"
              min={8}
              max={40}
              value={settings.headingFontSize}
              onChange={(e) => setSetting("headingFontSize", Number(e.target.value) || 22)}
            />
          </Field>
          <Field label="Footer text size" htmlFor="set-footer-size">
            <Input
              id="set-footer-size"
              type="number"
              min={5}
              max={18}
              step="0.5"
              value={settings.footerFontSize}
              onChange={(e) => setSetting("footerFontSize", Number(e.target.value) || 8.5)}
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

    </div>
  );
}
