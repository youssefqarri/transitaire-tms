import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative border border-[var(--color-rule)] bg-[var(--color-card)]",
        "shadow-[0_1px_0_0_var(--color-rule)]",
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
      "flex items-baseline justify-between gap-4 px-6 py-5 border-b border-[var(--color-rule)]",
      className,
    )}
    {...p}
  />
);

export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3
    className={cn(
      "font-display text-[19px] leading-tight tracking-[-0.012em]",
      className,
    )}
    {...p}
  />
);

export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <p className={cn("text-[13px] text-[var(--color-ink-mute)]", className)} {...p} />
);

export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-5", className)} {...p} />
);

export const CardFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-4 border-t border-[var(--color-rule)]", className)} {...p} />
);
