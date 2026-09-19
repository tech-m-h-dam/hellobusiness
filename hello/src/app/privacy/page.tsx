import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles your data: anonymous invoices stay in your browser, and nothing is uploaded unless you explicitly save to an account.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }]} />
      </div>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Privacy Policy</h1>
        <p className="mt-2 text-[13px] text-ink-500">Last updated: 19 September 2026</p>

        <div className="prose-doc mt-8">
          <h2>The short version</h2>
          <p>
            If you use the invoice generator without signing in, your invoice data never reaches our
            servers. It is created, calculated, stored and turned into a PDF entirely inside your
            browser. We cannot read it, because we never receive it.
          </p>

          <h2>What stays in your browser</h2>
          <p>
            The following are stored locally on your device using your browser&rsquo;s IndexedDB
            storage, and are not transmitted to us:
          </p>
          <ul>
            <li>The invoice you are currently editing, saved automatically as you type.</li>
            <li>Your invoice history created on this device.</li>
            <li>Your saved business profile, customers and products.</li>
            <li>Any logo, line-item image or signature you upload.</li>
            <li>Custom templates you create.</li>
          </ul>
          <p>
            This data is removed if you clear your browser&rsquo;s site data, use private browsing, or
            switch device or browser. We have no copy of it and cannot restore it.
          </p>

          <h2>What we receive, and when</h2>
          <p>We receive your invoice data in exactly one situation:</p>
          <ul>
            <li>
              You sign in with Google <em>and</em> click <strong>Save to my account</strong> on a
              specific invoice. That invoice is then stored against your account so you can open it on
              another device. This is never automatic.
            </li>
          </ul>
          <p>If you sign in with Google, we store your name, email address and profile image, along with the date you last signed in. We do not receive your Google password.</p>

          <h2>Images and uploads</h2>
          <p>
            Logos, product photos and signatures are processed in your browser — validated, resized
            and compressed on your device — and embedded in your invoice as data. They are not
            uploaded to us for anonymous use. If you save an invoice to your account, images embedded
            in that invoice are stored with it.
          </p>

          <h2>Analytics</h2>
          <p>
            If analytics is enabled on this deployment, we record anonymous product events — that an
            invoice was started, that a PDF was downloaded, that a template was selected. These events
            carry no invoice content. We never send customer names, addresses, email addresses, phone
            numbers, bank details, line items or totals to any analytics service.
          </p>

          <h2>Cookies</h2>
          <p>
            We do not use cookies for tracking. A session cookie is set only if you choose to sign in,
            because authentication requires one. Everything else uses local browser storage, which is
            not transmitted with requests the way cookies are.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>Use the tool without an account — then we hold nothing about your invoices.</li>
            <li>Clear your browser&rsquo;s site data to erase all locally-stored invoices.</li>
            <li>Delete a saved invoice from your account at any time from <Link href="/my-invoices">My Invoices</Link>.</li>
            <li>Contact us to have your account and all associated data deleted.</li>
          </ul>

          <h2>Contact</h2>
          <p>
            Questions about this policy can be sent through our <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </article>
    </>
  );
}
