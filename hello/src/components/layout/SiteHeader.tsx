import Link from "next/link";
import { FileText } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/site";

/** Server component — no client JS for the site chrome. */
export function SiteHeader() {
  const nav = [
    { href: "/invoice-templates", label: "Templates" },
    { href: "/invoice-examples", label: "Examples" },
    { href: "/guides", label: "Guides" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink-900">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
            <FileText className="size-4" />
          </span>
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-600 transition-colors hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/invoice-generator"
          className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Create Free Invoice
        </Link>
      </div>
    </header>
  );
}
