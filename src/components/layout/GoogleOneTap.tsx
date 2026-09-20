"use client";

/**
 * Google sign-in prompt for signed-out visitors, in two layers.
 *
 * 1. Google One Tap (FedCM). Zero-click when the browser already holds a
 *    session previously consented for this app. The browser owns that UI and
 *    anchors it at the top right; its placement and styling are not ours to
 *    set. Its credential is verified server-side and never navigates, so a
 *    half-finished invoice stays exactly where it is.
 * 2. Our own top-right card, shown shortly after load if One Tap hasn't
 *    signed the visitor in. FedCM stays silent in plenty of ordinary cases —
 *    no Google session, the cooldown after a recent dismissal, Safari and
 *    Firefox, third-party sign-in switched off, an unauthorised origin — and
 *    without this layer those visitors see no prompt at all.
 *
 * The card runs the ordinary redirect-based OAuth flow rather than Google's
 * `renderButton` widget: the widget is an iframe we can't style to match the
 * card, and it renders blank in exactly the situations this fallback exists to
 * cover. The redirect is safe here because the editor autosaves its draft to
 * IndexedDB and `callbackUrl` returns to the page the visitor was on.
 */
import Script from "next/script";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/google-icon";

/**
 * How long to let One Tap have the screen to itself. An eligible visitor is
 * signed in well inside this window (the callback fires without a click), so
 * in practice the card only appears for visitors One Tap can't serve.
 */
const CARD_DELAY_MS = 2500;

/** How often to re-check whether a modal that blocks the card has closed. */
const MODAL_RECHECK_MS = 800;

/** Dismissal is per-tab: a visitor who closes the card isn't asked again. */
const DISMISSED_KEY = "hb:signin-prompt-dismissed";

interface CredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    itp_support?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }): void;
  prompt(): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    // Private mode / storage blocked — treat as not dismissed.
    return false;
  }
}

export function GoogleOneTap() {
  const router = useRouter();
  const initialized = useRef(false);
  const signedIn = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCard, setShowCard] = useState(false);

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      try {
        const res = await fetch("/api/auth/google-one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (res.ok) {
          signedIn.current = true;
          setShowCard(false);
          router.refresh();
        }
      } catch {
        // One Tap is a convenience path; the card below and the header's
        // "Sign in" button remain available if this silently fails.
      }
    },
    [router],
  );

  const start = useCallback(() => {
    if (initialized.current || !window.google) return;
    initialized.current = true;

    const id = window.google.accounts.id;
    id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      callback: (response) => {
        void handleCredential(response);
      },
      // Signs the user straight in with no click when the browser already has
      // a single Google session previously consented for this app; otherwise
      // falls back to the one-click floating prompt.
      auto_select: true,
      itp_support: true,
      // Chrome removed the legacy (non-FedCM) One Tap UI in late 2024 —
      // without this, prompt() below is a silent no-op and the popup never
      // renders. This is now required, not optional.
      use_fedcm_for_prompt: true,
    });
    id.prompt();

    if (wasDismissed()) return;
    const offer = () => {
      if (signedIn.current) return;
      // Never stack on top of the feature tour or any other open modal —
      // a first-time visitor would be answering two prompts at once.
      if (document.querySelector('[role="dialog"]')) {
        timer.current = setTimeout(offer, MODAL_RECHECK_MS);
        return;
      }
      // Close any One Tap still on screen first: under FedCM its visibility
      // can't be queried, so cancelling is the only way to be sure the
      // visitor is looking at one prompt rather than two stacked corners.
      id.cancel();
      setShowCard(true);
    };
    timer.current = setTimeout(offer, CARD_DELAY_MS);
  }, [handleCredential]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    setShowCard(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to persist to; the card simply returns on the next page load.
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        // onReady also fires when the script is already loaded from an earlier
        // page in the session, which onLoad would not.
        onReady={start}
      />

      {showCard && (
        <div
          role="region"
          aria-label="Sign in with Google"
          data-print="hide"
          // Sits clear of the sticky header (h-22) and below the z-50 modals.
          className="fixed right-4 top-24 z-40 w-[calc(100vw-2rem)] max-w-[21rem] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss sign-in prompt"
            className="absolute right-2 top-2 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <div className="flex items-start gap-3 p-4 pr-10">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"
              aria-hidden="true"
            >
              <Cloud className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink-900">Save your invoices</p>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-600">
                Sign in to keep them on your account and open them on any device.
              </p>
            </div>
          </div>

          <div className="border-t border-ink-100 bg-ink-50/60 p-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() =>
                signIn("google", {
                  callbackUrl: window.location.pathname + window.location.search,
                })
              }
            >
              <GoogleIcon /> Continue with Google
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="mt-2 w-full text-[12px] text-ink-500 transition-colors hover:text-ink-700"
            >
              Not now
            </button>
            <p className="mt-2 text-center text-[11px] leading-snug text-ink-400">
              Your invoices stay in this browser either way.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
