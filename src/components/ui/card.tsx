import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--color-border)]",
      className,
    )}
    {...p}
  />
);

export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3 className={cn("text-[14px] font-semibold text-[var(--color-fg)]", className)} {...p} />
);

export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <p className={cn("text-[13px] text-[var(--color-fg-3)]", className)} {...p} />
);

export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 py-4", className)} {...p} />
);

export const CardFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 py-3 border-t border-[var(--color-border)]", className)} {...p} />
);
