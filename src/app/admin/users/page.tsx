import { ShieldCheck, ShieldMinus, ShieldPlus, User as UserIcon } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { setUserAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // The layout already proved this session is an admin; this read is for
  // identifying *which* admin, so the page can refuse to offer them a control
  // over their own access that the action would reject anyway.
  const session = await auth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { savedInvoices: true } } },
  });
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Users</h1>
      <p className="mt-1 text-[13px] text-ink-500">{users.length} registered</p>

      {users.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-ink-300 p-10 text-center text-ink-600">
          No users yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  src={user.image}
                  size={36}
                  className="size-9 shrink-0 rounded-full"
                  fallback={
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-400">
                      <UserIcon className="size-4" aria-hidden="true" />
                    </span>
                  }
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium text-ink-900">
                    <span className="truncate">{user.name ?? "Unnamed"}</span>
                    {user.isAdmin && (
                      <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-label="Admin" />
                    )}
                  </p>
                  <p className="truncate text-[13px] text-ink-500">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-[12px] text-ink-500">
                  <p>{user._count.savedInvoices} saved invoice{user._count.savedInvoices === 1 ? "" : "s"}</p>
                  <p>Joined {user.createdAt.toLocaleDateString("en-GB")}</p>
                  <p>{user.lastLogin ? `Last seen ${user.lastLogin.toLocaleDateString("en-GB")}` : "No login recorded"}</p>
                </div>

                {user.id === session?.user?.id ? (
                  <p className="w-36 text-right text-[12px] text-ink-400">You</p>
                ) : (
                  <form action={setUserAdmin} className="w-36 text-right">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="makeAdmin" value={user.isAdmin ? "false" : "true"} />
                    <Button
                      type="submit"
                      size="sm"
                      variant={user.isAdmin ? "outline" : "secondary"}
                      // The action refuses this too; disabling it here just
                      // avoids offering a button that cannot work.
                      disabled={user.isAdmin && adminCount === 1}
                    >
                      {user.isAdmin ? <ShieldMinus /> : <ShieldPlus />}
                      {user.isAdmin ? "Revoke admin" : "Make admin"}
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
