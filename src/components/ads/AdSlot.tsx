
export function AdSlot({
  slot,
  format = "horizontal",
  className = "",
}: {
  slot: string;
  format?: "horizontal" | "rectangle";
  className?: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) return null;

  const height = format === "horizontal" ? 90 : 250;

  return (
    <div
      className={`ad-slot mx-auto flex w-full items-center justify-center overflow-hidden ${className}`}
      style={{ minHeight: height }}
      data-print="hide"
      aria-hidden="true"
    >
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block", height }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
