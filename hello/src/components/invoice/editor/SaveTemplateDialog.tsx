"use client";

/**
 * Save the current look as a reusable template, and manage saved ones.
 *
 * A saved template captures only presentation — colours, fonts, page setup,
 * table style, column and section visibility, and any renamed labels. It never
 * captures business, customer or line-item data, so applying one to a different
 * invoice can't overwrite that invoice's contents.
 *
 * Saved locally in IndexedDB, so this works with no account (spec section 16).
 */
import { useEffect, useState } from "react";
import { Check, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { type CustomTemplate, templateStore } from "@/lib/invoice/storage";
import { makeId } from "@/lib/invoice/defaults";
import { track } from "@/lib/analytics/track";

export function SaveTemplateDialog() {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const update = useInvoiceEditor((s) => s.update);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<CustomTemplate[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void templateStore.getAll().then((all) => {
      if (!cancelled) setSaved(all);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const template: CustomTemplate = {
        id: makeId("tpl"),
        name: trimmed,
        baseTemplateId: invoice.templateId,
        // Presentation only — no invoice content is captured here.
        settings: invoice.settings,
        labels: invoice.labels ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await templateStore.put(template.id, template);
      setSaved(await templateStore.getAll());
      setName("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      track("template_created");
    } finally {
      setBusy(false);
    }
  }

  function apply(template: CustomTemplate) {
    update((inv) => ({
      ...inv,
      templateId: template.baseTemplateId,
      settings: { ...inv.settings, ...template.settings },
      labels: { ...template.labels },
    }));
    setOpen(false);
  }

  async function remove(id: string) {
    await templateStore.delete(id);
    setSaved(await templateStore.getAll());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Save /> My templates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My templates</DialogTitle>
          <DialogDescription>
            Save the current colours, fonts, layout, columns and labels as a reusable template.
            Your invoice content is never part of a template, so applying one is always safe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <Field label="Template name" htmlFor="tpl-name" className="flex-1">
            <Input
              id="tpl-name"
              value={name}
              placeholder="e.g. Studio green, A5 compact"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void save();
                }
              }}
            />
          </Field>
          <Button type="button" onClick={save} disabled={busy || !name.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : <Save />}
            Save
          </Button>
        </div>

        {justSaved && (
          <p className="flex items-center gap-1.5 text-[13px] text-green-700" role="status">
            <Check className="size-4" /> Template saved in this browser.
          </p>
        )}

        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ink-800">
            Saved templates {saved.length > 0 && `(${saved.length})`}
          </h3>
          {saved.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-300 p-6 text-center text-[13px] text-ink-500">
              No saved templates yet. Style your invoice, then save it here to reuse it.
            </p>
          ) : (
            <ul className="divide-y divide-ink-200 overflow-hidden rounded-lg border border-ink-200">
              {saved.map((template) => (
                <li key={template.id} className="flex items-center gap-3 p-3">
                  <span
                    className="size-6 shrink-0 rounded"
                    style={{ backgroundColor: template.settings.primaryColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink-900">{template.name}</p>
                    <p className="text-[12px] text-ink-500">
                      Based on {template.baseTemplateId} ·{" "}
                      {new Date(template.updatedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => apply(template)}>
                    Use
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete template ${template.name}`}
                    onClick={() => remove(template.id)}
                  >
                    <Trash2 className="text-ink-400" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
