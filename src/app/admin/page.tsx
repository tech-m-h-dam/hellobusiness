import Link from "next/link";
import { FileText, Inbox, Users } from "lucide-react";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [posts, drafts, messages, unhandled, users, savedInvoices] = await Promise.all([
    prisma.blogPost.count({ where: { status: "published" } }),
    prisma.blogPost.count({ where: { status: "draft" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.user.count(),
    prisma.savedInvoice.count(),
  ]);

  const cards = [
    { label: "Published posts", value: posts, sub: `${drafts} draft${drafts === 1 ? "" : "s"}`, href: "/admin/blog", icon: FileText },
    { label: "Contact messages", value: messages, sub: `${unhandled} unread`, href: "/admin/messages", icon: Inbox },
    { label: "Registered users", value: users, sub: `${savedInvoices} saved invoices`, href: "/admin/users", icon: Users },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, sub, href, icon: Icon }) => (
          <li key={label}>
            <Link href={href} className="block rounded-xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md">
              <Icon className="size-5 text-brand-600" aria-hidden="true" />
              <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
              <p className="text-[13px] font-medium text-ink-700">{label}</p>
              <p className="text-[12px] text-ink-500">{sub}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-5">
        <h2 className="text-[15px] font-semibold text-ink-900">Content that lives in code</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-600">
          Invoice templates, invoice-type landing pages, guides and worked examples are defined in
          content registries under <code className="rounded bg-white px-1">src/lib/content</code> and{" "}
          <code className="rounded bg-white px-1">src/lib/invoice/templates.ts</code>. They are
          statically generated so public pages never hit the database. Blog posts, managed here, are
          the database-backed content type.
        </p>
      </div>
    </>
  );
}
