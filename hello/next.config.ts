import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` on style-src is required by Tailwind/React inline styles used
 * by the invoice template renderer (user-configurable colors/sizes are applied as
 * inline styles). `blob:` and `data:` on img-src are required because uploaded
 * logos, item images and generated QR codes never leave the browser — they are
 * held as data URLs / blobs.
 */
const csp = [
  "default-src 'self'",
  // next/script and the Next.js runtime need inline+eval in dev; eval is dropped in prod.
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://www.google-analytics.com",
  "frame-src 'self' https://googleads.g.doubleclick.net",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    // Keeps icon/utility imports from pulling whole barrels into the client bundle.
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Immutable, content-hashed build assets.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Canonicalisation: duplicate-intent URLs that do not carry differentiated
      // content redirect to the canonical tool page (see src/lib/seo/routes.ts).
      {
        source: "/online-invoice-generator",
        destination: "/invoice-generator",
        permanent: true,
      },
      {
        source: "/invoice-creator",
        destination: "/invoice-generator",
        permanent: true,
      },
      {
        source: "/create-invoice",
        destination: "/invoice-generator",
        permanent: true,
      },
      { source: "/templates", destination: "/invoice-templates", permanent: true },
      { source: "/examples", destination: "/invoice-examples", permanent: true },
    ];
  },
};

export default nextConfig;
