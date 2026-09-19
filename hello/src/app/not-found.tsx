import Link from "next/link";
import { FileQuestion } from "lucide-react";

/**
 * 404. Rather than a dead end, it routes to the things people were most likely
 * looking for (spec section 68).
 */
export default function NotFound() {
  const links = [
    { href: "/invoice-generator", label: "Invoice Generator", detail: "Create an invoice now" },
    { href: "/invoice-templates", label: "Invoice Templates", detail: "Browse all templates" },
    { href: "/invoice-examples", label: "Invoice Examples", detail: "See filled-in samples" },
    { href: "/guides", label: "Guides", detail: "How to invoice and get paid" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <FileQuestion className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900">Page not found</h1>
      <p className="mt-3 max-w-lg text-ink-600">
        That page doesn&rsquo;t exist — it may have moved, or the link may be wrong. Here&rsquo;s
        where most people are heading:
      </p>

      <ul className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-xl border border-ink-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-semibold text-ink-900">{link.label}</p>
              <p className="mt-0.5 text-[13px] text-ink-600">{link.detail}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Go to the homepage
      </Link>
    </div>
  );
}
