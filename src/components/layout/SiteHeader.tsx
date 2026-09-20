import Link from "next/link";
import { SITE_NAME } from "@/lib/seo/site";
import { HeaderNav } from "./HeaderNav";
import Image from "next/image";

/**
 * Server component; only the nav/language controls hydrate.
 *
 * The session is read once in the root layout (it also gates Google One
 * Tap) and passed down here, rather than each calling `auth()` itself.
 */
export function SiteHeader({
  user,
  googleConfigured,
}: {
  user: { name: string | null; image: string | null } | null;
  googleConfigured: boolean;
}) {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75"
    >
      <div className="mx-auto flex h-22 max-w-7xl items-center justify-between gap-4 px-4">
        {/*
         * The brand block gives way before the page does: it may shrink, and
         * the wordmark only appears once there is room for it alongside the
         * nav links and the CTA. Pinned at its full width it was 271px of a
         * 1024px header that also had to fit four nav links, the language
         * picker, sign-in and the CTA — the surplus became horizontal page
         * scroll on every page. `lg` is where the nav links, the full
         * language name and the long CTA label all arrive at once, so the
         * wordmark waits until `xl`, the first width with room for all of it.
         */}
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold text-ink-900">
          {/* <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white"> */}
          {/* Rendered smaller than its intrinsic size on phones: at 390px the
              full-size mark plus the language, sign-in and CTA controls were
              6px wider than the viewport, which scrolled the whole page
              sideways. */}
          <Image
            src="/icons/lol.png"
            alt="Logo"
            width={88}
            height={88}
            className="h-auto w-16 shrink-0 sm:w-22"
          />
          {/* </span> */}
          <span className="hidden truncate xl:inline">{SITE_NAME}</span>
        </Link>

        <HeaderNav user={user} googleConfigured={googleConfigured} />
      </div>
    </header>
  );
}
