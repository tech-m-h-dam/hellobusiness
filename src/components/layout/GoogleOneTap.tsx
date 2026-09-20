"use client";

/**
 * Google One Tap — a low-friction sign-in prompt that appears on its own
 * (no click needed to start it) using Google Identity Services, as opposed
 * to the explicit "Sign in with Google" button which starts the full
 * redirect-based OAuth flow.
 *
 * Rendered once in the root layout, only when signed out and configured
 * (see layout.tsx). Deliberately does not navigate away on success — it can
 * appear on any page, including mid-draft on the invoice generator, so a
 * successful sign-in just refreshes the server-rendered parts of the page
 * (e.g. the header) in place via `router.refresh()`.
 */
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useRef } from "react";

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
  }): void;
  prompt(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

export function GoogleOneTap() {
  const router = useRouter();
  const initialized = useRef(false);

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      try {
        const res = await fetch("/api/auth/google-one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (res.ok) router.refresh();
      } catch {
        // One Tap is a convenience path; the "Sign in with Google" button
        // elsewhere remains available if this silently fails.
      }
    },
    [router],
  );

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        if (initialized.current || !window.google) return;
        initialized.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void handleCredential(response);
          },
          // Signs the user straight in with no click when the browser
          // already has a single Google session previously consented for
          // this app; otherwise falls back to the one-click floating prompt.
          auto_select: true,
          itp_support: true,
        });
        window.google.accounts.id.prompt();
      }}
    />
  );
}
