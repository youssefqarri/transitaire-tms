import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--color-border-2)] bg-[var(--color-surface-2)] text-[var(--color-fg-2)]",
        info:
          "border-transparent bg-[var(--color-info-soft)] text-[var(--color-info)]",
        ok:
          "border-transparent bg-[var(--color-success-soft)] text-[var(--color-success)]",
        warn:
          "border-transparent bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        danger:
          "border-transparent bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
        outline:
          "border-[var(--color-border)] text-[var(--color-fg-3)] bg-transparent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
