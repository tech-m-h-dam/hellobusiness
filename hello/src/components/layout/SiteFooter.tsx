import Link from "next/link";
import { SITE_NAME } from "@/lib/seo/site";

/**
 * Footer link clusters (spec section 77). Doubles as the site's primary
 * internal-linking surface, so every important page is reachable in one hop
 * from anywhere.
 */
const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Invoice Generator",
    links: [
      { href: "/invoice-generator", label: "Free Invoice Generator" },
      { href: "/invoice-pdf-generator", label: "Invoice PDF Generator" },
      { href: "/printable-invoice", label: "Printable Invoice" },
      { href: "/invoice-templates", label: "Invoice Templates" },
      { href: "/invoice-examples", label: "Invoice Examples" },
    ],
  },
  {
    title: "Invoice Types",
    links: [
      { href: "/gst-invoice-generator", label: "GST Invoice Generator" },
      { href: "/tax-invoice-generator", label: "Tax Invoice Generator" },
      { href: "/service-invoice-generator", label: "Service Invoice Generator" },
      { href: "/sales-invoice-generator", label: "Sales Invoice Generator" },
      { href: "/freelance-invoice-generator", label: "Freelancer Invoice Generator" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/guides", label: "Invoicing Guides" },
      { href: "/blog", label: "Blog" },
      { href: "/guides/how-to-create-an-invoice", label: "How to create an invoice" },
      { href: "/guides/what-should-an-invoice-include", label: "What an invoice should include" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer data-site-footer className="mt-20 border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-[13px] font-semibold text-ink-900">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13px] text-ink-600 transition-colors hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-ink-200 pt-6 text-[12px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Free invoice generator — no signup required.
          </p>
          <p>Invoices are created in your browser. Your invoice data is not uploaded to our servers.</p>
        </div>
      </div>
    </footer>
  );
}
