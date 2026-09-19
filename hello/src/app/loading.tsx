/**
 * Route-level loading state. Deliberately a skeleton with fixed dimensions
 * rather than a spinner, so swapping it for real content does not shift layout.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-ink-100" />
      <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-ink-100" />
      <div className="mt-2 h-5 w-3/4 max-w-xl animate-pulse rounded bg-ink-100" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl bg-ink-100" />
        <div className="h-96 animate-pulse rounded-xl bg-ink-100" />
      </div>
    </div>
  );
}
