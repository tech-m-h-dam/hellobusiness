import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SignInButton } from "@/components/layout/SignInButton";
import { googleConfigured } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Optional sign-in to save invoices to your account.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <ShieldCheck className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink-900">Sign in (optional)</h1>
      <p className="mt-3 text-ink-600">
        You don&rsquo;t need an account to create or download invoices — signing in only lets you
        save invoices so you can open them on another device.
      </p>

      <div className="mt-8 flex justify-center">
        {googleConfigured ? (
          <SignInButton />
        ) : (
          <p className="rounded-lg bg-ink-50 px-4 py-3 text-[13px] text-ink-600">
            Google sign-in isn&rsquo;t configured on this deployment. The invoice generator works
            fully without it.
          </p>
        )}
      </div>

      <p className="mt-8 text-[13px] text-ink-500">
        We only receive your name, email and profile image. Your invoices are never uploaded unless
        you explicitly choose &ldquo;Save to my account&rdquo;. See our{" "}
        <Link href="/privacy" className="text-brand-700 underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>

      <Link
        href="/invoice-generator"
        className="mt-8 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← Back to the invoice generator
      </Link>
    </section>
  );
}
