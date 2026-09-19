"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route error boundary.
 *
 * Reassures the user that a rendering failure has not cost them their invoice —
 * drafts live in IndexedDB, independent of React state — and offers a retry
 * before anything drastic.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error itself only — never invoice contents (spec section 80).
    console.error("[app] route error", error.message, error.digest);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900">Something went wrong</h1>
      <p className="mt-3 max-w-lg text-ink-600">
        This page failed to load. Your invoice is still saved in this browser — nothing has been
        lost. Try again, and if it keeps happening, start a fresh invoice from the generator.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
        <Link
          href="/invoice-generator"
          className="inline-flex h-10 items-center rounded-lg border border-ink-300 bg-white px-4 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
        >
          Go to the invoice generator
        </Link>
      </div>
    </div>
  );
}
