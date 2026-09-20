"use client";

/**
 * Rename any wording printed on the invoice.
 *
 * Each input shows the current label with the built-in default as its
 * placeholder, so a user can always see what they are overriding and clear a
 * field to get the default back. Only changed labels are stored on the invoice
 * (pruneLabels), which keeps saved invoices small and lets the defaults improve
 * over time without rewriting anyone's data.
 */
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { DEFAULT_LABELS, LABEL_GROUPS, type LabelKey, pruneLabels } from "@/lib/invoice/labels";

export function LabelsPanel() {
  const labels = useInvoiceEditor((s) => s.invoice.labels ?? {});
  const update = useInvoiceEditor((s) => s.update);

  const setLabel = (key: LabelKey, value: string) =>
    update((inv) => ({
      ...inv,
      // An empty string is a meaningful override (blank the header), so it is
      // stored; only a value identical to the default is pruned away.
      labels: pruneLabels({ ...inv.labels, [key]: value }),
    }));

  const resetAll = () => update((inv) => ({ ...inv, labels: {} }));

  const changedCount = Object.keys(labels).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] leading-relaxed text-ink-600">
          Rename anything printed on the invoice — useful for other languages, or
          for wording your industry uses. Leave a field blank to hide that
          heading; clear it back to the placeholder to restore the default.
        </p>
        {changedCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={resetAll} className="shrink-0">
            <RotateCcw /> Reset ({changedCount})
          </Button>
        )}
      </div>

      {LABEL_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-2 text-[13px] font-semibold text-ink-800">{group.title}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.keys.map((key) => {
              const id = `label-${key}`;
              const current = labels[key];
              const isOverridden = current !== undefined;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <Label htmlFor={id} className="flex items-center gap-1.5">
                    {DEFAULT_LABELS[key] || key}
                    {isOverridden && (
                      <span className="rounded bg-brand-50 px-1 text-[10px] font-medium text-brand-700">
                        changed
                      </span>
                    )}
                  </Label>
                  <Input
                    id={id}
                    value={current ?? ""}
                    placeholder={DEFAULT_LABELS[key] || "(blank)"}
                    onChange={(e) => setLabel(key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
