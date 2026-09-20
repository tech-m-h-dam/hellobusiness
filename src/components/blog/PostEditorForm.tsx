import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { savePost } from "@/app/admin/blog/actions";

export type PostDraft = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: string;
};

/**
 * Post editor. A plain server-rendered form posting to a Server Action — no
 * client JavaScript at all, which keeps the admin light and means it still
 * works if scripts fail.
 */
export function PostEditorForm({ post }: { post?: PostDraft }) {
  return (
    <form action={savePost} className="mt-6 max-w-3xl space-y-4">
      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <Field label="Title" htmlFor="post-title" required>
        <Input id="post-title" name="title" defaultValue={post?.title ?? ""} required />
      </Field>

      <Field label="Slug" htmlFor="post-slug" hint="Leave blank to generate from the title">
        <Input id="post-slug" name="slug" defaultValue={post?.slug ?? ""} />
      </Field>

      <Field label="Excerpt" htmlFor="post-excerpt" hint="Shown on the blog index">
        <Textarea id="post-excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} />
      </Field>

      <Field label="Content" htmlFor="post-content" required hint="Markdown-style plain text">
        <Textarea id="post-content" name="content" rows={16} defaultValue={post?.content ?? ""} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title" htmlFor="post-seo-title" hint="Defaults to the post title">
          <Input id="post-seo-title" name="seoTitle" defaultValue={post?.seoTitle ?? ""} />
        </Field>
        <Field label="SEO description" htmlFor="post-seo-desc">
          <Input id="post-seo-desc" name="seoDescription" defaultValue={post?.seoDescription ?? ""} />
        </Field>
      </div>

      <Field label="Status" htmlFor="post-status">
        <select
          id="post-status"
          name="status"
          defaultValue={post?.status ?? "draft"}
          className="flex h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </Field>

      <Button type="submit">Save post</Button>
    </form>
  );
}
