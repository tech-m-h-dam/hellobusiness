/**
 * Client-side image processing for logos and line-item images.
 *
 * Nothing here ever leaves the browser. Every uploaded file is validated,
 * decoded, resized and re-compressed via <canvas> before it becomes a data URL
 * that goes into invoice state — so what gets stored (and eventually printed
 * into the PDF) is always bounded in size, dimensions and format, regardless of
 * what the user dragged in. See spec sections 7, 40.
 */
import { makeId } from "./defaults";
import { IMAGE_UPLOAD_LIMITS } from "./limits";
import type { ItemImage } from "./types";

export type ImageValidationError =
  | "invalid-type"
  | "too-large"
  | "dimensions-too-large"
  | "decode-failed";

export class ImageProcessingError extends Error {
  constructor(public code: ImageValidationError, message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Confirm the file's *actual* bytes are one of our accepted image formats,
 * rather than trusting the browser-reported MIME type (which comes from the
 * file extension and is trivial to spoof). Reads the first 12 bytes and checks
 * each format's magic number.
 */
async function sniffImageType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const hex = (n: number) => head[n]?.toString(16).padStart(2, "0");

  // PNG: 89 50 4E 47
  if (hex(0) === "89" && hex(1) === "50" && hex(2) === "4e" && hex(3) === "47") {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (hex(0) === "ff" && hex(1) === "d8" && hex(2) === "ff") {
    return "image/jpeg";
  }
  // WebP: "RIFF"...."WEBP"
  if (
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function loadImageBitmap(file: File | Blob): Promise<ImageBitmap> {
  return createImageBitmap(file).catch(() => {
    throw new ImageProcessingError("decode-failed", "This file could not be read as an image.");
  });
}

/** Draw a bitmap onto a canvas at the given box, preserving aspect ratio (contain). */
function drawScaled(bitmap: ImageBitmap, maxDimension: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageProcessingError("decode-failed", "Canvas is not supported here.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToDataUrl(canvas: HTMLCanvasElement, mime: string, quality: number): string {
  return canvas.toDataURL(mime, quality);
}

/** Re-encode a canvas, stepping quality down until it fits the byte budget. */
function compressToBudget(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): { dataUrl: string } {
  // PNGs with transparency need PNG output; canvas.toDataURL always supports
  // image/jpeg re-encoding for everything else, which compresses far better
  // for photographic content. We detect alpha use and pick accordingly.
  const ctx = canvas.getContext("2d");
  let hasAlpha = false;
  if (ctx) {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4 * 37) {
      // sample every 37th pixel's alpha channel — enough to detect real
      // transparency without scanning the whole (possibly large) buffer
      if (data[i] < 255) {
        hasAlpha = true;
        break;
      }
    }
  }

  const mime = hasAlpha ? "image/png" : "image/jpeg";
  if (mime === "image/png") {
    // PNG ignores the quality argument; size is controlled by dimensions only.
    return { dataUrl: canvasToDataUrl(canvas, mime, 1) };
  }

  let quality = 0.9;
  let dataUrl = canvasToDataUrl(canvas, mime, quality);
  while (dataUrl.length * 0.75 > maxBytes && quality > 0.3) {
    quality -= 0.15;
    dataUrl = canvasToDataUrl(canvas, mime, quality);
  }
  return { dataUrl };
}

export type ProcessedImage = {
  id: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Validate and process an uploaded image file end-to-end: type sniff, size
 * limits, resize to the app's max working dimension, compress to the byte
 * budget, and produce a small thumbnail for list views. Everything happens
 * in-memory; the caller decides what to do with the resulting data URLs.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const limits = IMAGE_UPLOAD_LIMITS;

  if (file.size > limits.maxBytesOriginal) {
    throw new ImageProcessingError(
      "too-large",
      `"${file.name}" is larger than ${Math.round(limits.maxBytesOriginal / 1024 / 1024)}MB.`,
    );
  }

  const sniffed = await sniffImageType(file);
  if (!sniffed || !(limits.acceptedMime as readonly string[]).includes(sniffed)) {
    throw new ImageProcessingError(
      "invalid-type",
      `"${file.name}" isn't a JPG, PNG or WebP image.`,
    );
  }

  const bitmap = await loadImageBitmap(file);
  try {
    if (bitmap.width > limits.maxDimension || bitmap.height > limits.maxDimension) {
      throw new ImageProcessingError(
        "dimensions-too-large",
        `"${file.name}" is too large (max ${limits.maxDimension}px per side).`,
      );
    }

    const mainCanvas = drawScaled(bitmap, limits.processedMaxDimension);
    const { dataUrl: src } = compressToBudget(mainCanvas, limits.processedMaxBytes);

    const thumbCanvas = drawScaled(bitmap, limits.thumbMaxDimension);
    const { dataUrl: thumb } = compressToBudget(thumbCanvas, 60 * 1024);

    return {
      id: makeId("img"),
      src,
      thumb,
      width: mainCanvas.width,
      height: mainCanvas.height,
      bytes: Math.round((src.length * 3) / 4),
    };
  } finally {
    bitmap.close();
  }
}

/** Build the full `ItemImage` record the invoice model expects. */
export function toItemImage(processed: ProcessedImage, alt = ""): ItemImage {
  return {
    id: processed.id,
    src: processed.src,
    thumb: processed.thumb,
    alt,
    width: processed.width,
    height: processed.height,
    bytes: processed.bytes,
  };
}

/** Process a logo upload the same way, at a size appropriate for a header mark. */
export async function processLogoFile(file: File): Promise<ProcessedImage> {
  return processImageFile(file);
}

/**
 * Crop a data URL to a rectangle (normalized 0..1 coordinates) and re-encode.
 * Used by the in-editor crop tool; kept separate from the upload pipeline so
 * it can be re-applied without re-reading the original file.
 */
export async function cropDataUrl(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const bitmap = await loadImageBitmap(blob);
  try {
    const sx = Math.round(rect.x * bitmap.width);
    const sy = Math.round(rect.y * bitmap.height);
    const sw = Math.max(1, Math.round(rect.width * bitmap.width));
    const sh = Math.max(1, Math.round(rect.height * bitmap.height));

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageProcessingError("decode-failed", "Canvas is not supported here.");
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvasToDataUrl(canvas, "image/jpeg", 0.9);
  } finally {
    bitmap.close();
  }
}

/** Human-readable file size, for upload UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
