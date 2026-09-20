"use client";

/**
 * A remote avatar with a fallback that survives the image not loading.
 *
 * `next/image` is used *without* `unoptimized` on purpose: the optimizer
 * fetches and caches the file server-side, so Google sees one request per
 * avatar per cache period instead of one per visitor per render — see the
 * `remotePatterns` note in next.config.ts for why hotlinking these fails
 * intermittently.
 *
 * `fallback` is whatever the surrounding page already shows for a user with no
 * picture at all (initials, an icon), so a load failure looks like an account
 * without a photo rather than a broken image.
 */
import Image from "next/image";
import { useState } from "react";

export function Avatar({
  src,
  size,
  className,
  fallback,
}: {
  src?: string | null;
  size: number;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
