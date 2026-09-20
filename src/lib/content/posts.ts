import "server-only";

/**
 * Published blog posts, read from the CMS for the public blog pages.
 *
 * The blog pages are cached and revalidated (see the `revalidate` export on
 * each, and the `revalidatePath("/blog")` in the admin's save action), so a
 * reader never causes a database query — publishing a post regenerates the
 * pages, and everything served in between is static. That keeps the public
 * site off the database path in the way lib/db/client describes, while still
 * showing posts the moment they are published.
 *
 * Every query is failure-tolerant: a build or a preview deploy without a
 * reachable database should render the blog with the guides on it, not a 500.
 */
import { excerptFrom, readingMinutes } from "./post-body";

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readingMinutes: number;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
};

/**
 * Imported lazily so a missing DATABASE_URL surfaces as "no posts" rather than
 * a module-evaluation crash that takes the whole page down — lib/db/client
 * throws on import when it has nothing to connect to.
 */
async function client() {
  const { prisma } = await import("@/lib/db/client");
  return prisma;
}

type PostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  category: { name: string } | null;
};

function toSummary(row: PostRow): BlogPostSummary {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt?.trim() || excerptFrom(row.content),
    category: row.category?.name ?? "Blog",
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    readingMinutes: readingMinutes(row.content),
  };
}

export async function listPublishedPosts(): Promise<BlogPostSummary[]> {
  try {
    const prisma = await client();
    const rows = await prisma.blogPost.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { category: { select: { name: true } } },
    });
    return rows.map(toSummary);
  } catch {
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    const prisma = await client();
    const row = await prisma.blogPost.findFirst({
      where: { slug, status: "published" },
      include: { category: { select: { name: true } } },
    });
    if (!row) return null;
    const summary = toSummary(row);
    return {
      ...summary,
      content: row.content,
      seoTitle: row.seoTitle?.trim() || row.title,
      seoDescription: row.seoDescription?.trim() || summary.excerpt,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}
