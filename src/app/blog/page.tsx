import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { GUIDES } from "@/lib/content/guides";
import { listPublishedPosts } from "@/lib/content/posts";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";

/**
 * Blog index.
 *
 * Lists everything editorial in one dated list: posts published through the
 * admin CMS alongside the guides. They are deliberately not two separate
 * sections — from a reader's side they are the same kind of thing, so they get
 * the same card, the same metadata and one ordering, and a post published
 * today opens the list rather than being filed underneath the guides.
 *
 * Cached and regenerated rather than rendered per request: publishing a post
 * calls `revalidatePath("/blog")` (see app/admin/blog/actions.ts), so a new
 * post appears here immediately without the page ever querying the database
 * for an ordinary reader. The hourly window is the backstop for anything that
 * changes without going through that action.
 */
export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Blog — Invoicing, Getting Paid and Running a Small Business",
  description:
    "Articles on invoicing, payment terms, tax handling and getting paid on time, from the team behind the free invoice generator.",
  path: "/blog",
});

type Entry = {
  href: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await listPublishedPosts();

  const entries: Entry[] = [
    ...posts.map((post) => ({
      href: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt,
    })),
    ...GUIDES.map((guide) => ({
      href: `/guides/${guide.slug}`,
      title: guide.title,
      description: guide.description,
      category: guide.category,
      publishedAt: guide.publishedAt,
    })),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Blog</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
          Writing on invoicing and getting paid. Our in-depth reference material lives in the{" "}
          <Link href="/guides" className="text-brand-700 underline underline-offset-2">
            guides section
          </Link>
          ; everything we have published is below, newest first.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="group flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <span className="text-[12px] font-medium uppercase tracking-wide text-brand-700">
                  {entry.category}
                </span>
                <h2 className="mt-2 text-[15px] font-semibold text-ink-900 group-hover:text-brand-700">
                  {entry.title}
                </h2>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-600">
                  {entry.description}
                </p>
                <time dateTime={entry.publishedAt} className="mt-4 text-[12px] text-ink-500">
                  {formatDate(entry.publishedAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
