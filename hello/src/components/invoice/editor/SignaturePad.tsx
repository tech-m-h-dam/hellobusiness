"use client";

/**
 * Signature capture: draw with a pointer, or upload an image.
 *
 * Produces a transparent-background PNG data URL held in invoice state — never
 * uploaded. Pointer events (not mouse/touch separately) so it works with mouse,
 * finger and stylus from one code path.
 */
import { useEffect, useRef, useState } from "react";
import { Eraser, Upload } from "lucide-react";
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
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { ImageProcessingError, processImageFile } from "@/lib/invoice/images";

export function SignaturePad() {
  const signature = useInvoiceEditor((s) => s.invoice.signature);
  const update = useInvoiceEditor((s) => s.update);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<typeof signature>) =>
    update((inv) => ({ ...inv, signature: { ...inv.signature, ...p } }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Size the backing store to the device pixel ratio so strokes aren't blurry.
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) patch({ src: canvas.toDataURL("image/png") });
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    patch({ src: undefined });
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const processed = await processImageFile(file);
      patch({ src: processed.src });
    } catch (err) {
      setError(err instanceof ImageProcessingError ? err.message : "Couldn't read that image.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {signature.src ? (
        <div className="rounded-lg border border-ink-200 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- in-browser data URL */}
          <img src={signature.src} alt="Your signature" className="max-h-24 object-contain" />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="h-28 w-full touch-none rounded-lg border-2 border-dashed border-ink-300 bg-white"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          aria-label="Draw your signature"
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={clear}>
          <Eraser /> Clear
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload /> Upload image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => void onUpload(e.target.files?.[0])}
        />
      </div>

      {error && <p className="text-[12px] text-red-600" role="alert">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Signed by" htmlFor="sig-name">
          <Input id="sig-name" value={signature.name ?? ""} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="Width (px)" htmlFor="sig-width">
          <Input
            id="sig-width"
            type="number"
            min={40}
            max={400}
            value={signature.width}
            onChange={(e) => patch({ width: Number(e.target.value) || 160 })}
          />
        </Field>
        <Field label="Position" htmlFor="sig-align">
          <Select value={signature.align} onValueChange={(v) => patch({ align: v as "left" | "center" | "right" })}>
            <SelectTrigger id="sig-align">
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
    </div>
  );
}
