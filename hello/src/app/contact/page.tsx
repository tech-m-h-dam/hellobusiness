import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ContactForm } from "@/components/layout/ContactForm";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with the ${SITE_NAME} team about the free invoice generator — questions, bug reports and feature requests.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      </div>
      <section className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Contact us</h1>
        <p className="mt-3 text-ink-600">
          Questions about the invoice generator, a bug to report, or something you wish it did? Send
          us a note.
        </p>
        <p className="mt-2 text-[13px] text-ink-500">
          Please don&rsquo;t include invoice contents or customer details in your message — we
          don&rsquo;t need them, and we&rsquo;d rather not hold them.
        </p>

        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
