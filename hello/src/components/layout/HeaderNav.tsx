"use client";

/**
 * Translated navigation + the language switcher.
 *
 * Split out of SiteHeader (a server component) so only this small piece is a
 * client island: the header's markup and the logo stay server-rendered, and
 * static content pages pay for the locale store and this component rather than
 * for the whole header.
 */
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useRestoreLocale, useT } from "@/lib/i18n/use-locale";
import type { MessageKey } from "@/lib/i18n/messages";

const NAV: { href: string; key: MessageKey }[] = [
  { href: "/invoice-templates", key: "navTemplates" },
  { href: "/invoice-examples", key: "navExamples" },
  { href: "/guides", key: "navGuides" },
  { href: "/blog", key: "navBlog" },
];

export function HeaderNav() {
  // The header is on every page, so restoring the saved language here means the
  // whole app picks it up rather than only the editor.
  useRestoreLocale();
  const t = useT();

  return (
    <div className="flex items-center gap-3">
      <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-ink-600 transition-colors hover:text-ink-900"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>

      <LanguageSwitcher />

      <Link
        href="/invoice-generator"
        className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        {t("navCreateInvoice")}
      </Link>
    </div>
  );
}
