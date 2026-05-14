import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full px-3 py-1 text-[14px] font-sans",
        "bg-[var(--color-card)] border-b border-[var(--color-rule-strong)] border-x-0 border-t-0 rounded-none",
        "placeholder:text-[var(--color-ink-mute)]",
        "focus-visible:outline-none focus-visible:border-[var(--color-ink)]",
        "transition-colors disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
