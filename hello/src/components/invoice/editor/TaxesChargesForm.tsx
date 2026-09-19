"use client";

/**
 * Taxes, invoice-level discounts and additional charges.
 *
 * Tax configuration is entirely data-driven (spec section 10): the UI only
 * knows about a name, a rate, percentage-vs-fixed, and inclusive-vs-exclusive.
 * Nothing here encodes any jurisdiction's rules, so changing tax law never
 * requires changing this component — only the presets in defaults.ts.
 */
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { TAX_PRESETS, createCharge, createDiscount, createTax, makeId } from "@/lib/invoice/defaults";

export function TaxesChargesForm() {
  const taxes = useInvoiceEditor((s) => s.invoice.taxes);
  const discounts = useInvoiceEditor((s) => s.invoice.discounts);
  const charges = useInvoiceEditor((s) => s.invoice.charges);
  const roundTotal = useInvoiceEditor((s) => s.invoice.settings.roundTotal);
  const update = useInvoiceEditor((s) => s.update);

  /** Applying a preset replaces the tax list and re-points every line item at the new taxes. */
  function applyPreset(label: string) {
    const preset = TAX_PRESETS.find((p) => p.label === label);
    if (!preset) return;
    const newTaxes = preset.taxes.map((t) => ({ ...t, id: makeId("tax") }));
    update((inv) => ({
      ...inv,
      taxes: newTaxes,
      items: inv.items.map((item) => ({ ...item, taxIds: newTaxes.map((t) => t.id) })),
    }));
  }

  return (
    <div className="space-y-5">
      {/* Taxes ------------------------------------------------------------ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-800">Taxes</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => update((inv) => ({ ...inv, taxes: [...inv.taxes, createTax()] }))}
          >
            <Plus /> Add tax
          </Button>
        </div>

        <Field label="Quick preset" htmlFor="tax-preset" hint="Applies to all line items">
          <Select onValueChange={applyPreset}>
            <SelectTrigger id="tax-preset">
              <SelectValue placeholder="Choose a common tax setup…" />
            </SelectTrigger>
            <SelectContent>
              {TAX_PRESETS.map((p) => (
                <SelectItem key={p.label} value={p.label}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {taxes.map((tax) => (
          <div key={tax.id} className="space-y-2 rounded-lg border border-ink-200 p-3">
            <div className="flex gap-2">
              <Input
                aria-label="Tax name"
                className="flex-1"
                placeholder="GST, VAT, Sales Tax…"
                value={tax.name}
                onChange={(e) =>
                  update((inv) => ({
                    ...inv,
                    taxes: inv.taxes.map((t) => (t.id === tax.id ? { ...t, name: e.target.value } : t)),
                  }))
                }
              />
              <Input
                aria-label="Tax rate"
                className="w-24"
                type="number"
                step="any"
                value={tax.rate}
                onChange={(e) =>
                  update((inv) => ({
                    ...inv,
                    taxes: inv.taxes.map((t) => (t.id === tax.id ? { ...t, rate: Number(e.target.value) } : t)),
                  }))
                }
              />
              <Select
                value={tax.mode}
                onValueChange={(v) =>
                  update((inv) => ({
                    ...inv,
                    taxes: inv.taxes.map((t) =>
                      t.id === tax.id ? { ...t, mode: v as "percentage" | "fixed" } : t,
                    ),
                  }))
                }
              >
                <SelectTrigger className="w-24" aria-label="Tax mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${tax.name || "tax"}`}
                onClick={() =>
                  update((inv) => ({
                    ...inv,
                    taxes: inv.taxes.filter((t) => t.id !== tax.id),
                    items: inv.items.map((i) => ({ ...i, taxIds: i.taxIds.filter((id) => id !== tax.id) })),
                  }))
                }
              >
                <Trash2 className="text-ink-400" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`tax-incl-${tax.id}`} className="cursor-pointer">
                Price includes this tax
              </Label>
              <Switch
                id={`tax-incl-${tax.id}`}
                checked={tax.inclusive}
                onCheckedChange={(checked) =>
                  update((inv) => ({
                    ...inv,
                    taxes: inv.taxes.map((t) => (t.id === tax.id ? { ...t, inclusive: checked } : t)),
                  }))
                }
              />
            </div>
          </div>
        ))}
      </section>

      {/* Invoice discount ------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-800">Invoice discount</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => update((inv) => ({ ...inv, discounts: [...inv.discounts, createDiscount()] }))}
          >
            <Plus /> Add discount
          </Button>
        </div>
        {discounts.map((d) => (
          <div key={d.id} className="flex gap-2">
            <Input
              aria-label="Discount label"
              className="flex-1"
              value={d.label}
              onChange={(e) =>
                update((inv) => ({
                  ...inv,
                  discounts: inv.discounts.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)),
                }))
              }
            />
            <Input
              aria-label="Discount value"
              className="w-24"
              type="number"
              step="any"
              value={d.value}
              onChange={(e) =>
                update((inv) => ({
                  ...inv,
                  discounts: inv.discounts.map((x) => (x.id === d.id ? { ...x, value: Number(e.target.value) } : x)),
                }))
              }
            />
            <Select
              value={d.type}
              onValueChange={(v) =>
                update((inv) => ({
                  ...inv,
                  discounts: inv.discounts.map((x) =>
                    x.id === d.id ? { ...x, type: v as "percentage" | "fixed" } : x,
                  ),
                }))
              }
            >
              <SelectTrigger className="w-24" aria-label="Discount type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">%</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove discount"
              onClick={() =>
                update((inv) => ({ ...inv, discounts: inv.discounts.filter((x) => x.id !== d.id) }))
              }
            >
              <Trash2 className="text-ink-400" />
            </Button>
          </div>
        ))}
      </section>

      {/* Charges ---------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-800">Shipping &amp; other charges</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => update((inv) => ({ ...inv, charges: [...inv.charges, createCharge()] }))}
          >
            <Plus /> Add charge
          </Button>
        </div>
        {charges.map((c) => (
          <div key={c.id} className="space-y-2 rounded-lg border border-ink-200 p-3">
            <div className="flex gap-2">
              <Input
                aria-label="Charge label"
                className="flex-1"
                value={c.label}
                onChange={(e) =>
                  update((inv) => ({
                    ...inv,
                    charges: inv.charges.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)),
                  }))
                }
              />
              <Input
                aria-label="Charge value"
                className="w-24"
                type="number"
                step="any"
                value={c.value}
                onChange={(e) =>
                  update((inv) => ({
                    ...inv,
                    charges: inv.charges.map((x) => (x.id === c.id ? { ...x, value: Number(e.target.value) } : x)),
                  }))
                }
              />
              <Select
                value={c.type}
                onValueChange={(v) =>
                  update((inv) => ({
                    ...inv,
                    charges: inv.charges.map((x) =>
                      x.id === c.id ? { ...x, type: v as "percentage" | "fixed" } : x,
                    ),
                  }))
                }
              >
                <SelectTrigger className="w-24" aria-label="Charge type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${c.label || "charge"}`}
                onClick={() => update((inv) => ({ ...inv, charges: inv.charges.filter((x) => x.id !== c.id) }))}
              >
                <Trash2 className="text-ink-400" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`charge-tax-${c.id}`} className="cursor-pointer">
                Apply taxes to this charge
              </Label>
              <Switch
                id={`charge-tax-${c.id}`}
                checked={c.taxable}
                onCheckedChange={(checked) =>
                  update((inv) => ({
                    ...inv,
                    charges: inv.charges.map((x) =>
                      x.id === c.id
                        ? { ...x, taxable: checked, taxIds: checked ? inv.taxes.map((t) => t.id) : [] }
                        : x,
                    ),
                  }))
                }
              />
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5">
        <div>
          <Label htmlFor="round-total" className="cursor-pointer">
            Round total to a whole number
          </Label>
          <p className="text-[12px] text-ink-500">Shows the rounding adjustment as its own line.</p>
        </div>
        <Switch
          id="round-total"
          checked={roundTotal}
          onCheckedChange={(checked) =>
            update((inv) => ({ ...inv, settings: { ...inv.settings, roundTotal: checked } }))
          }
        />
      </div>
    </div>
  );
}
