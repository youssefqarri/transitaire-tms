import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full px-3 text-[13px]",
        "bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)]",
        "placeholder:text-[var(--color-fg-mute)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:border-transparent",
        "transition-shadow disabled:opacity-50 disabled:cursor-not-allowed",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:mr-3",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
