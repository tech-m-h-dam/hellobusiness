"use client";

/**
 * The post-download upsell.
 *
 * Shown only *after* a PDF has been downloaded — never before, and never as an
 * interruption during invoice creation (spec section 4). Dismissible, and it
 * stays dismissed for the session so it cannot become nagging.
 */
import { useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Check, Cloud, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/layout/SignInButton";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { track } from "@/lib/analytics/track";

/**
 * SessionProvider is mounted here rather than in the root layout on purpose.
 * Wrapping the whole app would turn every page into a client subtree and add a
 * session fetch to pages that have nothing to do with accounts. Scoped here, the
 * /api/auth/session request happens only once someone has actually downloaded an
 * invoice and is being offered the save.
 */
export function SaveToAccountPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <SessionProvider>
      <SaveToAccountPromptInner onDismiss={onDismiss} />
    </SessionProvider>
  );
}

function SaveToAccountPromptInner({ onDismiss }: { onDismiss: () => void }) {
  const { data: session, status } = useSession();
  const invoice = useInvoiceEditor((s) => s.invoice);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveToAccount() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't save. Your invoice is still in this browser.");
        return;
      }
      setSaved(true);
      track("invoice_saved");
    } catch {
      setError("Couldn't reach the server. Your invoice is still saved in this browser.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return null;

  return (
    <div className="relative rounded-xl border border-brand-200 bg-brand-50/60 p-4" data-print="hide">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded p-1 text-ink-400 hover:bg-white hover:text-ink-700"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Cloud className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
        <div className="min-w-0">
          {saved ? (
            <p className="flex items-center gap-1.5 text-[14px] font-medium text-ink-900">
              <Check className="size-4 text-green-600" /> Saved to your account.
            </p>
          ) : (
            <>
              <p className="text-[14px] font-medium text-ink-900">
                Want to save this invoice for later?
              </p>
              <p className="mt-0.5 text-[13px] text-ink-600">
                {session?.user
                  ? "Save it to your account to open it on another device."
                  : "Sign in with Google to keep it against your account. Your invoice stays in this browser either way."}
              </p>
              <div className="mt-3">
                {session?.user ? (
                  <Button type="button" size="sm" onClick={saveToAccount} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" /> : <Cloud />}
                    {saving ? "Saving…" : "Save to my account"}
                  </Button>
                ) : (
                  <SignInButton callbackUrl="/invoice-generator" />
                )}
              </div>
              {error && (
                <p className="mt-2 text-[12px] text-red-700" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
