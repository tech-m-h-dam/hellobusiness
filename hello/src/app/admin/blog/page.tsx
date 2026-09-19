import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { deletePost } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Blog posts</h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="size-4" /> New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-ink-300 p-10 text-center text-ink-600">
          No posts yet. Create one to get started.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-ink-900">{post.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      post.status === "published"
                        ? "bg-green-50 text-green-700"
                        : "bg-ink-100 text-ink-600"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                <p className="truncate text-[13px] text-ink-500">/blog/{post.slug}</p>
              </div>

              <Link href={`/admin/blog/${post.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">
                Edit
              </Link>

              <form action={deletePost}>
                <input type="hidden" name="id" value={post.id} />
                <Button type="submit" variant="ghost" size="icon" aria-label={`Delete ${post.title}`}>
                  <Trash2 className="text-ink-400" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
