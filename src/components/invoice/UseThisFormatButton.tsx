"use client";

/**
 * Loads a worked example into the editor.
 *
 * The example is rebuilt from the same registry the page rendered from, given a
 * fresh id so it becomes the user's own draft rather than overwriting the
 * canonical example, then saved as the current draft and opened in the editor.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExample } from "@/lib/content/examples";
import { makeId } from "@/lib/invoice/defaults";
import { draftStore } from "@/lib/invoice/storage";

export function UseThisFormatButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function use() {
    const example = getExample(slug);
    if (!example) return;
    setBusy(true);
    try {
      const invoice = example.build();
      await draftStore.save({
        ...invoice,
        id: makeId("inv"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      router.push("/invoice-generator");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" onClick={use} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
      Use this format
    </Button>
  );
}
