import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/site";

/**
 * Default Open Graph image, generated at build time.
 *
 * Generated rather than committed so it cannot drift from the site's own
 * branding, and so there is no binary asset to keep in sync with copy changes.
 */
export const alt = "Free Invoice Generator — create and download invoices free";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#ffffff",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#2563eb",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 26, height: 32, background: "#fff", borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 30, color: "#475569", fontWeight: 600 }}>{SITE_NAME}</div>
        </div>

        <div style={{ fontSize: 76, fontWeight: 800, color: "#0f172a", marginTop: 40, lineHeight: 1.1 }}>
          Free Invoice Generator
        </div>
        <div style={{ fontSize: 34, color: "#475569", marginTop: 24, lineHeight: 1.35 }}>
          Create, customize and download professional invoices — no signup required.
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
          {["Free", "No signup", "No watermark", "PDF download"].map((chip) => (
            <div
              key={chip}
              style={{
                fontSize: 24,
                color: "#1d4ed8",
                background: "#eff6ff",
                border: "2px solid #bfdbfe",
                borderRadius: 99,
                padding: "10px 22px",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
