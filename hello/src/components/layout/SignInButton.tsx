"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Google sign-in trigger. Rendered only where auth is actually configured. */
export function SignInButton({ callbackUrl = "/my-invoices" }: { callbackUrl?: string }) {
  return (
    <Button type="button" variant="secondary" onClick={() => signIn("google", { callbackUrl })}>
      <LogIn /> Sign in with Google
    </Button>
  );
}
