import type { Metadata } from "next";
import { MyInvoices } from "@/components/invoice/MyInvoices";
import { auth, googleConfigured } from "@/lib/auth/config";

/**
 * Invoice history.
 *
 * noindex: this page is inherently user-specific and has no value in a search
 * index (it is also disallowed in robots.txt). Anonymous users see the history
 * held in their own browser; signed-in users additionally see invoices they
 * explicitly saved to their account.
 */
export const metadata: Metadata = {
  title: "My Invoices",
  description: "Your saved invoices.",
  robots: { index: false, follow: false },
};

export default async function MyInvoicesPage() {
  const session = googleConfigured ? await auth() : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">My invoices</h1>
      <p className="mt-3 text-ink-600">
        Invoices you have created in this browser, plus any you chose to save to your account.
      </p>
      <MyInvoices
        signedIn={Boolean(session?.user)}
        authAvailable={googleConfigured}
        userName={session?.user?.name ?? null}
      />
    </section>
  );
}
