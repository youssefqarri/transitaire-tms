import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full px-3 py-2 text-[14px] font-sans",
      "bg-[var(--color-card)] border border-[var(--color-rule-strong)] rounded-none",
      "placeholder:text-[var(--color-ink-mute)]",
      "focus-visible:outline-none focus-visible:border-[var(--color-ink)]",
      "disabled:opacity-50 resize-y",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
