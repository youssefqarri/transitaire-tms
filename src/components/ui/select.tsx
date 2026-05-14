import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full px-3 text-[14px] font-sans",
      "bg-[var(--color-card)] border-b border-[var(--color-rule-strong)] border-x-0 border-t-0 rounded-none appearance-none",
      "focus-visible:outline-none focus-visible:border-[var(--color-ink)]",
      "disabled:opacity-50",
      "bg-[length:10px] bg-no-repeat bg-[right_8px_center]",
      "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'><path fill='none' stroke='%231a1814' stroke-width='1.2' d='M2 4.5l4 4 4-4'/></svg>\")]",
      "pr-7",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
