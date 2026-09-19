import { Check } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { markMessageHandled } from "../blog/actions";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Contact messages</h1>

      {messages.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-ink-300 p-10 text-center text-ink-600">
          No messages yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`rounded-xl border p-4 ${
                message.handled ? "border-ink-200 bg-ink-50/60" : "border-brand-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">
                    {message.name} <span className="font-normal text-ink-500">&lt;{message.email}&gt;</span>
                  </p>
                  {message.subject && <p className="text-[13px] text-ink-600">{message.subject}</p>}
                  <p className="text-[12px] text-ink-500">
                    {message.createdAt.toLocaleString("en-GB")}
                  </p>
                </div>
                {!message.handled && (
                  <form action={markMessageHandled}>
                    <input type="hidden" name="id" value={message.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      <Check /> Mark handled
                    </Button>
                  </form>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
