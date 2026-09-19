"use client";

/**
 * Per-line-item image manager: upload (one or many), reorder, replace, remove,
 * and choose how the images render on the document.
 *
 * All processing is in-browser (lib/invoice/images.ts) — files are validated by
 * magic bytes, resized, compressed and thumbnailed before they ever enter
 * invoice state. Nothing is uploaded anywhere.
 */
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { ImageProcessingError, formatBytes, processImageFile, toItemImage } from "@/lib/invoice/images";
import { track } from "@/lib/analytics/track";
import type { InvoiceItem, ItemImageLayout } from "@/lib/invoice/types";

const LAYOUT_OPTIONS: { value: ItemImageLayout; label: string; hint: string }[] = [
  { value: "thumbnail", label: "Thumbnail", hint: "Small image beside the item" },
  { value: "large", label: "Large", hint: "One large product image" },
  { value: "gallery", label: "Gallery", hint: "All images side by side" },
  { value: "productCard", label: "Product card", hint: "Image with item details" },
  { value: "custom", label: "Custom", hint: "Set your own size and alignment" },
];

export function ItemImageManager({ item }: { item: InvoiceItem }) {
  const update = useInvoiceEditor((s) => s.update);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchItem = (patch: Partial<InvoiceItem>) =>
    update((inv) => ({
      ...inv,
      items: inv.items.map((i) => (i.id === item.id ? { ...i, ...patch } : i)),
    }));

  const patchImageSettings = (patch: Partial<InvoiceItem["imageSettings"]>) =>
    patchItem({ imageSettings: { ...item.imageSettings, ...patch } });

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const added: InvoiceItem["images"] = [];
    const failures: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const processed = await processImageFile(file);
        added.push(toItemImage(processed, file.name.replace(/\.[^.]+$/, "")));
      } catch (err) {
        failures.push(
          err instanceof ImageProcessingError ? err.message : `"${file.name}" couldn't be processed.`,
        );
      }
    }

    if (added.length) {
      patchItem({ images: [...item.images, ...added] });
      track("line_item_image_added", { count: added.length });
    }
    if (failures.length) setError(failures.join(" "));

    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function moveImage(index: number, direction: -1 | 1) {
    const next = [...item.images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patchItem({ images: next });
  }

  return (
    <div className="space-y-3 rounded-lg bg-ink-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {item.images.length ? "Add more images" : "Add images"}
        </Button>
        <span className="text-[12px] text-ink-500">JPG, PNG or WebP · resized in your browser</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => void onFilesSelected(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-600" role="alert">
          {error}
        </p>
      )}

      {item.images.length > 0 && (
        <>
          <ul className="flex flex-wrap gap-2">
            {item.images.map((img, index) => (
              <li key={img.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- in-browser data URL */}
                <img
                  src={img.thumb ?? img.src}
                  alt={img.alt ?? ""}
                  className="size-16 rounded-md border border-ink-200 bg-white object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 rounded-b-md bg-ink-900/70 py-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    className="text-white/90 hover:text-white disabled:opacity-30"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    aria-label="Move image left"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="text-white/90 hover:text-white"
                    onClick={() => patchItem({ images: item.images.filter((i) => i.id !== img.id) })}
                    aria-label="Remove image"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="text-white/90 hover:text-white disabled:opacity-30"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === item.images.length - 1}
                    aria-label="Move image right"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-ink-400">
            {item.images.length} image{item.images.length === 1 ? "" : "s"} ·{" "}
            {formatBytes(item.images.reduce((sum, i) => sum + (i.bytes ?? 0), 0))} stored in this browser
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Image layout" htmlFor={`img-layout-${item.id}`}>
              <Select
                value={item.imageSettings.layout}
                onValueChange={(v) => patchImageSettings({ layout: v as ItemImageLayout })}
              >
                <SelectTrigger id={`img-layout-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Alignment" htmlFor={`img-align-${item.id}`}>
              <Select
                value={item.imageSettings.align}
                onValueChange={(v) => patchImageSettings({ align: v as "left" | "center" | "right" })}
              >
                <SelectTrigger id={`img-align-${item.id}`}>
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

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Width (pt)" htmlFor={`img-w-${item.id}`}>
              <Input
                id={`img-w-${item.id}`}
                type="number"
                min={8}
                max={600}
                value={item.imageSettings.width}
                onChange={(e) => patchImageSettings({ width: Number(e.target.value) || 8 })}
              />
            </Field>
            <Field label="Height (pt)" htmlFor={`img-h-${item.id}`}>
              <Input
                id={`img-h-${item.id}`}
                type="number"
                min={8}
                max={600}
                value={item.imageSettings.height}
                onChange={(e) => patchImageSettings({ height: Number(e.target.value) || 8 })}
              />
            </Field>
            <Field label="Corner radius" htmlFor={`img-r-${item.id}`}>
              <Input
                id={`img-r-${item.id}`}
                type="number"
                min={0}
                max={100}
                value={item.imageSettings.radius}
                onChange={(e) => patchImageSettings({ radius: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`img-border-${item.id}`} className="cursor-pointer">
              Show image border
            </Label>
            <Switch
              id={`img-border-${item.id}`}
              checked={item.imageSettings.border}
              onCheckedChange={(checked) => patchImageSettings({ border: checked })}
            />
          </div>
        </>
      )}
    </div>
  );
}
