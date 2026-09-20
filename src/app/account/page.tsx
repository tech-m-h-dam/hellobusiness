import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Cloud, FileText, Mail, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { googleConfigured } from "@/lib/auth/status";
import { prisma } from "@/lib/db/client";
import { SignInButton } from "@/components/layout/SignInButton";
import { AccountInvoiceList } from "@/components/invoice/AccountInvoiceList";
import { SavedTemplateList } from "@/components/invoice/SavedTemplateList";

/**
 * Profile: who you are signed in as, and the invoices saved to the account.
 *
 * noindex — inherently user-specific, and disallowed in robots.txt.
 */
export const metadata: Metadata = {
  title: "My profile",
  description: "Your account and saved invoice history.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AccountPage() {
  if (!googleConfigured) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Accounts are not enabled</h1>
        <p className="mt-3 text-ink-600">
          Google sign-in isn&rsquo;t configured on this deployment. The invoice generator works fully
          without an account — your invoices are kept in this browser.
        </p>
        <Link href="/my-invoices" className="mt-6 inline-block text-sm font-medium text-brand-700">
          View invoices saved in this browser →
        </Link>
      </section>
    );
  }

  const session = await auth();
  if (!session?.user) {
    return (
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Sign in to your profile</h1>
        <p className="mt-3 text-ink-600">
          Signing in is optional — it lets you save invoices to your account so they&rsquo;re
          available on another device.
        </p>
        <div className="mt-8 flex justify-center">
          <SignInButton callbackUrl="/account" />
        </div>
      </section>
    );
  }

  const [user, invoices, templateCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, createdAt: true, lastLogin: true },
    }),
    prisma.savedInvoice.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      // Metadata only — the payloads aren't needed to list them.
      select: {
        id: true,
        invoiceNumber: true,
        title: true,
        templateId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.savedTemplate.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">My profile</h1>

      {/* Identity ---------------------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-white p-5">
        {user?.image ? (
          <Image
            src={user.image}
            alt=""
            width={56}
            height={56}
            className="size-14 rounded-full"
            unoptimized
          />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-700">
            {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink-900">{user?.name ?? "Signed in"}</p>
          <p className="flex items-center gap-1.5 truncate text-[13px] text-ink-600">
            <Mail className="size-3.5" aria-hidden="true" /> {user?.email}
          </p>
          <p className="mt-1 text-[12px] text-ink-500">
            Joined {user?.createdAt ? formatDate(user.createdAt) : "—"}
            {user?.lastLogin ? ` · Last signed in ${formatDate(user.lastLogin)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Admins reach the dashboard from here rather than having to know
              the /admin URL; everyone else never learns the route exists. */}
          {session.user.isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-100"
            >
              <ShieldCheck className="size-4" aria-hidden="true" /> Admin dashboard
            </Link>
          )}
          <Link
            href="/api/auth/signout"
            className="rounded-lg border border-ink-300 px-3 py-1.5 text-[13px] font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            Sign out
          </Link>
        </div>
      </div>

      {/* Counts ------------------------------------------------------------ */}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        <li className="rounded-xl border border-ink-200 bg-white p-5">
          <Cloud className="size-5 text-brand-600" aria-hidden="true" />
          <p className="mt-2 text-2xl font-bold text-ink-900">{invoices.length}</p>
          <p className="text-[13px] text-ink-600">Invoices saved to this account</p>
        </li>
        <li className="rounded-xl border border-ink-200 bg-white p-5">
          <FileText className="size-5 text-brand-600" aria-hidden="true" />
          <p className="mt-2 text-2xl font-bold text-ink-900">{templateCount}</p>
          <p className="text-[13px] text-ink-600">Saved templates</p>
        </li>
      </ul>

      {/* History ----------------------------------------------------------- */}
      <h2 className="mt-10 text-xl font-bold tracking-tight text-ink-900">Invoice history</h2>
      <p className="mt-1 text-[14px] text-ink-600">
        Invoices you chose to save to your account. Drafts kept only in this browser are on{" "}
        <Link href="/my-invoices" className="text-brand-700 underline underline-offset-2">
          My invoices
        </Link>
        .
      </p>

      <div className="mt-5">
        <AccountInvoiceList
          invoices={invoices.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            title: i.title,
            templateId: i.templateId,
            updatedAt: i.updatedAt.toISOString(),
          }))}
        />
      </div>

      {/* Templates --------------------------------------------------------- */}
      <h2 className="mt-12 text-xl font-bold tracking-tight text-ink-900">Saved templates</h2>
      <p className="mt-1 text-[14px] text-ink-600">
        Your saved looks — colours, fonts, layout, labels and tax setup. Kept in this browser.
      </p>
      <div className="mt-5">
        <SavedTemplateList />
      </div>
    </section>
  );
}
