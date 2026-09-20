import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GoogleOneTap } from "@/components/layout/GoogleOneTap";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { jsonLd, organizationSchema, websiteSchema } from "@/lib/seo/metadata";
import { optionalSession } from "@/lib/auth/session";
import { googleConfigured } from "@/lib/auth/status";

// `display: swap` keeps text visible during font load (protects LCP);
// next/font self-hosts the file, so there's no third-party font request.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Free Invoice Generator — Create & Download Invoices | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0D9381",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Only consult the session when auth is actually configured, so deployments
  // without OAuth keep every page statically renderable — and never let that
  // lookup take down a page that doesn't need it (see optionalSession).
  const session = await optionalSession();

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2309765797839806"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="flex min-h-full flex-col bg-white text-ink-900 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader
          user={session?.user ? { name: session.user.name ?? null, image: session.user.image ?? null } : null}
          googleConfigured={googleConfigured}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {googleConfigured && !session?.user && <GoogleOneTap />}

        {/* Site-wide structured data. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }}
        />
      </body>
    </html>
  );
}
