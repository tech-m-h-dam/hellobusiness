/**
 * Upload constraints, kept in their own module on purpose.
 *
 * These live here rather than in validation.ts because the client-side image
 * pipeline (images.ts, pulled into the editor bundle) needs the numbers but has
 * no use for Zod. Importing them from validation.ts dragged the whole schema
 * library into the browser bundle for every page that can upload an image.
 * Both the browser pipeline and the server-side Zod schema read from here.
 */
export const IMAGE_UPLOAD_LIMITS = {
  maxBytesOriginal: 15 * 1024 * 1024, // 15MB raw upload cap
  maxDimension: 4000, // reject absurd source dimensions before paying decode cost
  acceptedMime: ["image/jpeg", "image/png", "image/webp"] as const,
  // Targets after client-side processing (lib/invoice/images.ts):
  processedMaxDimension: 1600,
  processedMaxBytes: 600 * 1024,
  thumbMaxDimension: 240,
};
