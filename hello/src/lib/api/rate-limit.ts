/**
 * In-process rate limiter for the few API routes we have.
 *
 * Deliberately simple: a fixed-window counter in module memory. On a serverless
 * platform each instance keeps its own window, so this is a guard against
 * casual abuse and runaway clients, not a distributed quota. If the API surface
 * ever grows past "save my invoice" and "contact us", this should be swapped
 * for a shared store (Redis/Upstash) — the call signature is designed so that
 * swap touches only this file.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Evict expired windows so the map cannot grow without bound. */
function sweep(now: number) {
  if (windows.size < 5000) return;
  for (const [key, w] of windows) {
    if (w.resetAt <= now) windows.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Best-effort client identifier from proxy headers. */
export function clientKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}
