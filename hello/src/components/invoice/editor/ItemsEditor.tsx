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
                <div className="flex flex-wrap gap-2">
                  {taxes.map((tax) => {
                    const active = item.taxIds.includes(tax.id);
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
                        {tax.name} {tax.rate}
                        {tax.mode === "percentage" ? "%" : ""}
                      </button>
                    );
                  })}
                </div>
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
          update((inv) => ({ ...inv, items: [...inv.items, createLineItem()] }));
          track("item_added");
        }}
      >
        <Plus /> {t("addLineItem")}
      </Button>
    </div>
  );
}
