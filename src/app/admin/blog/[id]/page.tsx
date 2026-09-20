import { notFound } from "next/navigation";
import { PostEditorForm } from "@/components/blog/PostEditorForm";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function EditPostPage(props: PageProps<"/admin/blog/[id]">) {
  const { id } = await props.params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Edit post</h1>
      <PostEditorForm post={post} />
    </>
  );
}
