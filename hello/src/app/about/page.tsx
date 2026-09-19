import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { generateMetadata as buildMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `About ${SITE_NAME} — a free invoice generator that runs in your browser, built so invoice data never has to leave your device.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      </div>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">About {SITE_NAME}</h1>

        <div className="prose-doc mt-8">
          <p>
            {SITE_NAME} is a free invoice generator. You can create a professional invoice, customize
            it, and download it as a PDF without making an account, paying anything, or accepting a
            watermark.
          </p>

          <h2>Why it runs in your browser</h2>
          <p>
            Most invoice tools send your invoice to a server to calculate totals and render a PDF. We
            do neither. Calculations, image processing, storage and PDF generation all happen on your
            device.
          </p>
          <p>That choice has three consequences we think are worth it:</p>
          <ul>
            <li>
              <strong>Privacy.</strong> Your customers&rsquo; names, addresses and the amounts you
              bill are not data we hold, because they are not data we receive.
            </li>
            <li>
              <strong>Speed.</strong> There is no round trip. Totals update as you type and the PDF is
              ready as fast as your device can build it.
            </li>
            <li>
              <strong>Resilience.</strong> Once the page has loaded, the editor keeps working without
              a connection.
            </li>
          </ul>

          <h2>What we are not</h2>
          <p>
            This is an invoice generator, not accounting software. It does not track what has been
            paid, reconcile bank transactions, file tax returns or process payments. If you need those
            things you need a bookkeeping product; if you need to send someone a correct, professional
            invoice today, this does that well.
          </p>

          <h2>How it stays free</h2>
          <p>
            The running costs are low precisely because the work happens on your device rather than on
            our servers. The free invoice generator is intended to stay free and fully functional,
            with PDF download never placed behind a paywall.
          </p>

          <p>
            Start with the <Link href="/invoice-generator">invoice generator</Link>, browse the{" "}
            <Link href="/invoice-templates">templates</Link>, or read the{" "}
            <Link href="/guides">invoicing guides</Link>.
          </p>
        </div>
      </article>
    </>
  );
}
