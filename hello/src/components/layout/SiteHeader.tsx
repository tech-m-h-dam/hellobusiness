import Link from "next/link";
import { FileText } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/site";
import { HeaderNav } from "./HeaderNav";
import { auth } from "@/lib/auth/config";
import { googleConfigured } from "@/lib/auth/status";

/** Server component; only the nav/language controls hydrate. */
export async function SiteHeader() {
  // Only consult the session when auth is actually configured, so deployments
  // without OAuth keep every page statically renderable.
  const session = googleConfigured ? await auth() : null;
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-ink-900">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
            <FileText className="size-4" />
          </span>
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>

        <HeaderNav signedIn={Boolean(session?.user)} />
      </div>
    </header>
  );
}
