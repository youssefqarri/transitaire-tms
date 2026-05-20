import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[12px] font-medium text-[var(--color-fg-2)] inline-block",
        "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";
