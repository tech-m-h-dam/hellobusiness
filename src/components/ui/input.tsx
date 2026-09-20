import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600 focus-visible:border-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ink-50",
        "aria-[invalid=true]:border-red-500",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
