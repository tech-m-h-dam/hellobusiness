"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { createLineItem, makeId } from "@/lib/invoice/defaults";
import { formatMoney } from "@/lib/invoice/money";
import { track } from "@/lib/analytics/track";
import { useT } from "@/lib/i18n/use-locale";
import { ItemImageManager } from "./ItemImageManager";
import type { InvoiceItem } from "@/lib/invoice/types";

/** The standard Indian GST slabs. */
const GST_SLABS = [0, 5, 12, 18, 28] as const;

function ItemRow({ item, index, total }: { item: InvoiceItem; index: number; total: number }) {
  const update = useInvoiceEditor((s) => s.update);
  const taxes = useInvoiceEditor((s) => s.invoice.taxes);
  const computed = useInvoiceEditor((s) => s.totals.items[item.id]);
  const currency = useInvoiceEditor((s) => s.invoice.invoice.currency);
  const locale = useInvoiceEditor((s) => s.invoice.invoice.locale);
  const [expanded, setExpanded] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const patch = (p: Partial<InvoiceItem>) =>
    update((inv) => ({
      ...inv,
      items: inv.items.map((i) => (i.id === item.id ? { ...i, ...p } : i)),
    }));

  const appliedTaxes = taxes.filter((t) => item.taxIds.includes(t.id));
  // A GST setup is CGST+SGST (split at half each) or IGST (the full rate).
  const gstTaxes = appliedTaxes.filter((t) => /^(cgst|sgst|igst|gst)$/i.test(t.name.trim()));

  /** Set (or clear, when blank) this line's rate for one tax. */
  const setTaxRate = (taxId: string, raw: string) => {
    const next = { ...(item.taxRates ?? {}) };
    if (raw.trim() === "") delete next[taxId];
    else next[taxId] = Number(raw) || 0;
    patch({ taxRates: next });
  };

  /** Apply a GST slab across this line's GST taxes. */
  const applyGstSlab = (slab: number) => {
    const next = { ...(item.taxRates ?? {}) };
    const isSplit = gstTaxes.some((t) => /^(cgst|sgst)$/i.test(t.name.trim()));
    for (const tax of gstTaxes) {
      const name = tax.name.trim().toLowerCase();
      // CGST and SGST each carry half of the slab; IGST/GST carries all of it.
      next[tax.id] = isSplit && (name === "cgst" || name === "sgst") ? slab / 2 : slab;
    }
    patch({ taxRates: next });
  };

  const move = (direction: -1 | 1) =>
    update((inv) => {
      const items = [...inv.items];
      const target = index + direction;
      if (target < 0 || target >= items.length) return inv;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...inv, items };
    });

  const duplicate = () =>
    update((inv) => {
      const items = [...inv.items];
      // New ids for the copy and its images, so state keys stay unique.
      items.splice(index + 1, 0, {
        ...item,
        id: makeId("item"),
        images: item.images.map((img) => ({ ...img, id: makeId("img") })),
      });
      return { ...inv, items };
    });

  const remove = () =>
    update((inv) => ({
      ...inv,
      // Never leave the editor with zero rows — it reads as a broken tool.
      items: inv.items.length > 1 ? inv.items.filter((i) => i.id !== item.id) : [createLineItem()],
    }));

  return (
    <li className="rounded-lg border border-ink-200 bg-white p-3">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 sm:col-span-5">
          <Input
            aria-label={`Item ${index + 1} name`}
            placeholder="Item or service name"
            value={item.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>
        <div className="col-span-3 sm:col-span-2">
          <Input
            aria-label={`Item ${index + 1} quantity`}
            type="number"
            step="any"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => patch({ quantity: Number(e.target.value) })}
          />
        </div>
        <div className="col-span-4 sm:col-span-2">
          <Input
            aria-label={`Item ${index + 1} rate`}
            type="number"
            step="any"
            placeholder="Rate"
            value={item.rate}
            onChange={(e) => patch({ rate: Number(e.target.value) })}
          />
        </div>
        <div className="col-span-5 sm:col-span-3 flex items-center justify-end pr-1 text-sm font-medium text-ink-900">
          {formatMoney(computed?.total ?? 0, currency, locale)}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp /> : <ChevronDown />}
          Details
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImages((v) => !v)}
          aria-expanded={showImages}
        >
          <ImageIcon />
          Images{item.images.length ? ` (${item.images.length})` : ""}
        </Button>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => move(-1)}
            disabled={index === 0}
            aria-label={`Move item ${index + 1} up`}
          >
            <ChevronUp className="text-ink-400" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => move(1)}
            disabled={index === total - 1}
            aria-label={`Move item ${index + 1} down`}
          >
            <ChevronDown className="text-ink-400" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={duplicate} aria-label={`Duplicate item ${index + 1}`}>
            <Copy className="text-ink-400" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={remove} aria-label={`Remove item ${index + 1}`}>
            <Trash2 className="text-ink-400" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-ink-100 pt-3">
          <Field label="Description" htmlFor={`item-desc-${item.id}`}>
            <Textarea
              id={`item-desc-${item.id}`}
              rows={2}
              value={item.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What was delivered, hours worked, period covered…"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="SKU" htmlFor={`item-sku-${item.id}`}>
              <Input id={`item-sku-${item.id}`} value={item.sku ?? ""} onChange={(e) => patch({ sku: e.target.value })} />
            </Field>
            <Field label="HSN/SAC" htmlFor={`item-hsn-${item.id}`}>
              <Input id={`item-hsn-${item.id}`} value={item.hsn ?? ""} onChange={(e) => patch({ hsn: e.target.value })} />
            </Field>
            <Field label="Unit" htmlFor={`item-unit-${item.id}`}>
              <Input
                id={`item-unit-${item.id}`}
                value={item.unit ?? ""}
                onChange={(e) => patch({ unit: e.target.value })}
                placeholder="hrs, pcs, kg"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Discount" htmlFor={`item-disc-${item.id}`}>
              <div className="flex gap-2">
                <Input
                  id={`item-disc-${item.id}`}
                  type="number"
                  step="any"
                  value={item.discountValue}
                  onChange={(e) => patch({ discountValue: Number(e.target.value) })}
                />
                <Select
                  value={item.discountType}
                  onValueChange={(v) => patch({ discountType: v as "percentage" | "fixed" })}
                >
                  <SelectTrigger className="w-28" aria-label="Discount type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <div className="flex flex-col gap-1.5">
              <Label>Taxes applied</Label>
              {taxes.length === 0 ? (
                <p className="text-[12px] text-ink-500">
                  No taxes defined yet — add one in the Tax &amp; charges section.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {taxes.map((tax) => {
                      const active = item.taxIds.includes(tax.id);
                      const effective = item.taxRates?.[tax.id] ?? tax.rate;
                      return (
                        <button
                          key={tax.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            patch({
                              taxIds: active
                                ? item.taxIds.filter((id) => id !== tax.id)
                                : [...item.taxIds, tax.id],
                            })
                          }
                          className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                            active
                              ? "border-brand-600 bg-brand-50 text-brand-800"
                              : "border-ink-300 text-ink-600 hover:bg-ink-50"
                          }`}
                        >
                          {tax.name} {effective}
                          {tax.mode === "percentage" ? "%" : ""}
                        </button>
                      );
                    })}
                  </div>

                  {/* Per-line rates, so one invoice can carry several slabs. */}
                  {appliedTaxes.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg bg-ink-50 p-2.5">
                      <p className="text-[12px] text-ink-600">
                        Rate for this item — leave blank to use the tax&rsquo;s own rate.
                      </p>

                      {/* GST slabs set CGST/SGST to half each, IGST to the full rate. */}
                      {gstTaxes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[12px] text-ink-500">GST slab:</span>
                          {GST_SLABS.map((slab) => (
                            <button
                              key={slab}
                              type="button"
                              onClick={() => applyGstSlab(slab)}
                              className="rounded-full border border-ink-300 bg-white px-2 py-0.5 text-[12px] text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                            >
                              {slab}%
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid gap-2 sm:grid-cols-2">
                        {appliedTaxes.map((tax) => (
                          <Field key={tax.id} label={`${tax.name} rate`} htmlFor={`rate-${item.id}-${tax.id}`}>
                            <Input
                              id={`rate-${item.id}-${tax.id}`}
                              type="number"
                              step="any"
                              placeholder={String(tax.rate)}
                              value={item.taxRates?.[tax.id] ?? ""}
                              onChange={(e) => setTaxRate(tax.id, e.target.value)}
                            />
                          </Field>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showImages && (
        <div className="mt-3">
          <ItemImageManager item={item} />
        </div>
      )}
    </li>
  );
}

export function ItemsEditor() {
  const items = useInvoiceEditor((s) => s.invoice.items);
  const t = useT();
  const update = useInvoiceEditor((s) => s.update);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item, index) => (
          <ItemRow key={item.id} item={item} index={index} total={items.length} />
        ))}
      </ul>

      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          update((inv) => {
            /*
             * A new line inherits the tax treatment of the line above it — the
             * taxes applied and any per-line rate override. Starting untaxed
             * means every added line silently drops out of the tax total until
             * someone notices, which is exactly the kind of error an invoice
             * should not make easy.
             */
            const previous = inv.items[inv.items.length - 1];
            const inherited = previous
              ? { taxIds: [...previous.taxIds], taxRates: { ...(previous.taxRates ?? {}) } }
              : { taxIds: inv.taxes.map((tax) => tax.id), taxRates: {} };
            return { ...inv, items: [...inv.items, createLineItem(inherited)] };
          });
          track("item_added");
        }}
      >
        <Plus /> {t("addLineItem")}
      </Button>
    </div>
  );
}
