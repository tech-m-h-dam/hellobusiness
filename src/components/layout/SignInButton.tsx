"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Google sign-in trigger. Rendered only where auth is actually configured. */
export function SignInButton({
  callbackUrl = "/my-invoices",
  size = "md",
  children = "Sign in with Google",
}: {
  callbackUrl?: string;
  size?: ButtonProps["size"];
  children?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      onClick={() => signIn("google", { callbackUrl })}
    >
      <LogIn /> {children}
    </Button>
  );
}
