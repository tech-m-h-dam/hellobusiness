"use client";

/**
 * Translated navigation + the language switcher.
 *
 * Split out of SiteHeader (a server component) so only this small piece is a
 * client island: the header's markup and the logo stay server-rendered, and
 * static content pages pay for the locale store and this component rather than
 * for the whole header.
 */
import Image from "next/image";
import Link from "next/link";
import { UserCircle } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SignInButton } from "./SignInButton";
import { useRestoreLocale, useT } from "@/lib/i18n/use-locale";
import type { MessageKey } from "@/lib/i18n/messages";

const NAV: { href: string; key: MessageKey }[] = [
  { href: "/invoice-templates", key: "navTemplates" },
  { href: "/invoice-examples", key: "navExamples" },
  { href: "/guides", key: "navGuides" },
  { href: "/blog", key: "navBlog" },
];

type HeaderUser = { name: string | null; image: string | null };

export function HeaderNav({
  user = null,
  googleConfigured = false,
}: {
  user?: HeaderUser | null;
  googleConfigured?: boolean;
}) {
  // The header is on every page, so restoring the saved language here means the
  // whole app picks it up rather than only the editor.
  useRestoreLocale();
  const t = useT();

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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

      {user && (
        <Link
          href="/account"
          aria-label="My profile"
          className="rounded-lg p-0.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-full"
              unoptimized
            />
          ) : (
            <UserCircle className="size-5" />
          )}
        </Link>
      )}

      {!user && googleConfigured && <SignInButton size="sm">Sign in</SignInButton>}

      {/* The full call to action is long in every language; on small screens a
          short label keeps the header on one line without horizontal scroll. */}
      <Link
        href="/invoice-generator"
        className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg bg-brand-600 px-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 sm:px-4 sm:text-sm"
      >
        <span className="lg:hidden">{t("navCreateShort")}</span>
        <span className="hidden lg:inline">{t("navCreateInvoice")}</span>
      </Link>
    </div>
  );
}
