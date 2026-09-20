import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { GuideBody } from "@/components/blog/GuideBody";
import { AdSlot } from "@/components/ads/AdSlot";
import { getPublishedPost, listPublishedPosts } from "@/lib/content/posts";
import { parsePostBody } from "@/lib/content/post-body";
import { articleSchema, generateMetadata as buildMetadata, jsonLd } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

/**
 * A post published through the admin CMS.
 *
 * The body is parsed into the same blocks the guides are authored in and drawn
 * by the same renderer, so a post and a guide are the same page with different
 * sources — one page's typography cannot drift from the other's, and neither
 * renders an author-supplied HTML string.
 *
 * Known slugs are pre-rendered; `dynamicParams` stays on so a post published
 * after the last build is served (and then cached) rather than 404ing until
 * someone redeploys.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPublishedPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.seoTitle,
    description: post.seoDescription,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const blocks = parsePostBody(post.content);

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]}
        />
      </div>

      <article className="mx-auto max-w-3xl px-4 py-8">
        <header>
          <p className="text-[12px] font-medium uppercase tracking-wide text-brand-700">
            {post.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-500">
            <span>{SITE_NAME}</span>
            <span>Published {formatDate(post.publishedAt)}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" /> {post.readingMinutes} min read
            </span>
          </div>
        </header>

        {post.excerpt && (
          <p className="mt-8 rounded-xl border-l-4 border-brand-500 bg-brand-50/50 p-5 text-[16px] leading-relaxed text-ink-800">
            {post.excerpt}
          </p>
        )}

        <div className="mt-8">
          <GuideBody blocks={blocks} />
        </div>

        <div className="my-10">
          <AdSlot slot="guide-inline" />
        </div>

        <footer className="mt-12 border-t border-ink-200 pt-8">
          <Link
            href="/blog"
            className="text-[15px] font-medium text-brand-700 hover:text-brand-800"
          >
            ← All posts
          </Link>

          <div className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-6">
            <p className="text-[15px] font-semibold text-ink-900">Ready to create an invoice?</p>
            <p className="mt-1 text-[14px] text-ink-600">
              The free invoice generator runs in your browser — no signup, and a PDF at the end.
            </p>
            <Link
              href="/invoice-generator"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Create Free Invoice
            </Link>
          </div>
        </footer>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            articleSchema({
              headline: post.title,
              description: post.seoDescription,
              path: `/blog/${post.slug}`,
              publishedTime: post.publishedAt,
              modifiedTime: post.updatedAt,
            }),
          ),
        }}
      />
    </>
  );
}
