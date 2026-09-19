"use server";

/**
 * Blog post mutations, as Server Actions.
 *
 * Server Actions rather than API routes: these are form submissions from admin
 * pages, so they get CSRF protection and progressive enhancement from the
 * framework, and there is no public endpoint to defend. Every action
 * re-verifies admin authorization itself — being reachable only from a guarded
 * layout is not the same as being protected.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Not authorized");
  return session.user;
}

/** Turn a title into a URL-safe slug. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(80).optional(),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, "Content is required"),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(400).optional(),
  status: z.enum(["draft", "published"]),
});

export async function savePost(formData: FormData) {
  await requireAdmin();

  const parsed = postSchema.safeParse({
    id: (formData.get("id") as string) || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid post");
  }

  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  const publishing = data.status === "published";

  if (data.id) {
    await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt: publishing ? new Date() : null,
      },
    });
  } else {
    await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt: publishing ? new Date() : null,
      },
    });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function markMessageHandled(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  await prisma.contactMessage.update({ where: { id }, data: { handled: true } });
  revalidatePath("/admin/messages");
}
