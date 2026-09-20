"use client";

/**
 * Saved templates on the profile.
 *
 * Templates are stored in this browser (IndexedDB), like everything else
 * anonymous, so they appear here whether or not you're signed in — the profile
 * is just a convenient place to review and tidy them.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CustomTemplate, draftStore, templateStore } from "@/lib/invoice/storage";
import { getTemplate } from "@/lib/invoice/templates";

export function SavedTemplateList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CustomTemplate[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void templateStore.getAll().then((all) => {
      if (!cancelled) setTemplates(all);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function use(template: CustomTemplate) {
    const draft = await draftStore.get();
    if (draft) {
      await draftStore.save({
        ...draft,
        templateId: template.baseTemplateId,
        settings: { ...draft.settings, ...template.settings },
        labels: { ...template.labels },
      });
    }
    router.push("/invoice-generator");
  }

  async function remove(template: CustomTemplate) {
    if (!confirm(`Delete the template "${template.name}"?`)) return;
    await templateStore.delete(template.id);
    setTemplates(await templateStore.getAll());
  }

  if (templates === null) {
    return (
      <p className="flex items-center gap-2 text-[14px] text-ink-500">
        <Loader2 className="size-4 animate-spin" /> Loading templates…
      </p>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-300 p-8 text-center text-[14px] text-ink-600">
        No saved templates yet. Style an invoice, then choose{" "}
        <em>My templates → Save</em> to reuse that look.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {templates.map((template) => (
        <li
          key={template.id}
          className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4"
        >
          <span
            className="size-8 shrink-0 rounded-lg"
            style={{ backgroundColor: template.settings.primaryColor }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink-900">{template.name}</p>
            <p className="truncate text-[12px] text-ink-500">
              Based on {getTemplate(template.baseTemplateId).name}
              {template.taxes?.length ? ` · ${template.taxes.length} taxes` : ""}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => use(template)}>
            Use
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete template ${template.name}`}
            onClick={() => remove(template)}
          >
            <Trash2 className="text-ink-400" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
