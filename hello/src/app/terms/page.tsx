import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `The terms covering use of ${SITE_NAME}'s free invoice generator.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Terms of Service", path: "/terms" }]} />
      </div>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Terms of Service</h1>
        <p className="mt-2 text-[13px] text-ink-500">Last updated: 19 September 2026</p>

        <div className="prose-doc mt-8">
          <h2>Using the service</h2>
          <p>
            {SITE_NAME} provides a free tool for creating invoices. You may use it for personal and
            commercial purposes, including invoices you send to your own customers. The invoices you
            create are yours; we claim no rights over their content.
          </p>

          <h2>No warranty</h2>
          <p>
            The service is provided as is, without warranty of any kind. While the calculation engine
            is tested and we take its correctness seriously, you are responsible for checking that an
            invoice is accurate and appropriate before you send it.
          </p>

          <h2>Not tax or legal advice</h2>
          <p>
            Our guides and templates describe common invoicing practice. They are not tax, accounting
            or legal advice. Invoice requirements — required fields, tax rates, registration
            thresholds, retention periods — vary by jurisdiction and change over time. Verify what
            applies to you, or consult a qualified professional.
          </p>

          <h2>Your data</h2>
          <p>
            Invoices created without an account are stored only in your browser. We cannot recover
            them if you clear your browser data, and we are not responsible for such loss. Keep your
            own copies of invoices that matter — downloading the PDF is the simplest way.
          </p>
          <p>
            How we handle data is set out in our <Link href="/privacy">Privacy Policy</Link>.
          </p>

          <h2>Acceptable use</h2>
          <p>You agree not to use the service to create fraudulent or deceptive documents, to impersonate another business, or to attempt to disrupt the service for others.</p>

          <h2>Availability and changes</h2>
          <p>
            We may change or discontinue parts of the service. Because anonymous invoice creation runs
            entirely in your browser, it will generally continue to work for an already-loaded page
            even if our servers are unavailable.
          </p>

          <h2>Contact</h2>
          <p>
            Questions can be sent through our <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </article>
    </>
  );
}
