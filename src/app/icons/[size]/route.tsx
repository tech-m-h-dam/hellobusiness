import { ImageResponse } from "next/og";

/**
 * PWA icons, generated rather than committed as binaries.
 *
 * The manifest needs raster icons at specific sizes; generating them here keeps
 * a single source of truth for the mark (it matches app/icon.svg) and avoids
 * checking in binary assets that silently drift from the brand colour.
 */
export const dynamic = "force-static";

/** Only these sizes are generated — arbitrary sizes would be an open image-render endpoint. */
const SIZES = [192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, ctx: RouteContext<"/icons/[size]">) {
  const { size: sizeParam } = await ctx.params;
  const size = Number(sizeParam);
  if (!SIZES.includes(size as (typeof SIZES)[number])) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          borderRadius: size * 0.22,
        }}
      >
        <div
          style={{
            width: size * 0.5,
            height: size * 0.62,
            background: "#ffffff",
            borderRadius: size * 0.04,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: size * 0.05,
            padding: size * 0.08,
          }}
        >
          <div style={{ height: size * 0.045, background: "#2563eb", borderRadius: 99 }} />
          <div style={{ height: size * 0.045, background: "#93c5fd", borderRadius: 99, width: "100%" }} />
          <div style={{ height: size * 0.045, background: "#93c5fd", borderRadius: 99, width: "60%" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
