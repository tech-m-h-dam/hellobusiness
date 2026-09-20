import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FileText, Inbox, LayoutDashboard, LogOut, Users } from "lucide-react";
import { auth, googleConfigured } from "@/lib/auth/config";

/**
 * Admin shell.
 *
 * Authorization is enforced here, in a server component, on every admin route —
 * not in client code and not only in a proxy/middleware layer, so it cannot be
 * bypassed by navigating directly to a nested route. Admin identity comes from
 * the ADMIN_EMAILS environment variable, checked against the session's verified
 * Google email.
 *
 * The whole section is noindex, and /admin is disallowed in robots.txt.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/blog", label: "Blog posts", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!googleConfigured) {
    // No OAuth configured means no way to prove admin identity — fail closed.
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Admin unavailable</h1>
        <p className="mt-3 text-ink-600">
          Google sign-in is not configured on this deployment, so admin access cannot be verified.
          Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and ADMIN_EMAILS to enable it.
        </p>
      </div>
    );
  }

  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (!session.user.isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Not authorized</h1>
        <p className="mt-3 text-ink-600">
          This account does not have admin access.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-brand-700">
          ← Back to the site
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="w-52 shrink-0">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Admin</p>
        <nav aria-label="Admin" className="mt-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink-700 transition-colors hover:bg-ink-100"
            >
              <Icon className="size-4 text-ink-400" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink-500 transition-colors hover:bg-ink-100"
          >
            <LogOut className="size-4 text-ink-400" aria-hidden="true" />
            Sign out
          </Link>
        </nav>
        <p className="mt-6 px-3 text-[12px] text-ink-500">Signed in as {session.user.email}</p>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
