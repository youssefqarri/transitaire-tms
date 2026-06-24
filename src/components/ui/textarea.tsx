import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full px-3 py-2 text-[13px]",
      "bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)]",
      "placeholder:text-[var(--color-fg-mute)]",
      "transition-shadow duration-150",
      "hover:border-[var(--color-fg-mute)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)]",
      "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-danger)]/20",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-2)] resize-y",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
