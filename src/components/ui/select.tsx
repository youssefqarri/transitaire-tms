import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full pl-3 pr-8 text-[13px] appearance-none",
        "bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius-input)]",
        "transition-shadow duration-150",
        "hover:border-[var(--color-fg-mute)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-2)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]"
      strokeWidth={1.75}
    />
  </div>
));
Select.displayName = "Select";
