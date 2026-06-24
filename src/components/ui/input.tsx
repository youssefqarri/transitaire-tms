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
        "transition-shadow duration-150",
        "hover:border-[var(--color-fg-mute)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:border-transparent",
        "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-danger)]/20",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-2)]",
        "file:border-0 file:bg-transparent file:text-[14px] file:font-medium file:mr-3",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
