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
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-ink-900">
          {/* <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white"> */}
           <Image src="/icons/lol.png" alt="Logo" width={88} height={88} />
          {/* </span> */}
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>

        <HeaderNav user={user} googleConfigured={googleConfigured} />
      </div>
    </header>
  );
}
