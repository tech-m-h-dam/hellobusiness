import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

/**
 * PWA manifest. Installability matters here for a real reason rather than as a
 * checkbox: the editor works offline once loaded (local state, local storage,
 * in-browser PDF generation), so an installed copy is genuinely usable without
 * a connection.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Free Invoice Generator`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/invoice-generator",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
