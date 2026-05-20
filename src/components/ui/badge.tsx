import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border whitespace-nowrap",
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
        accent:
          "border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
        outline:
          "border-[var(--color-border-2)] text-[var(--color-fg-2)] bg-transparent",
        solid:
          "border-transparent bg-[var(--color-fg)] text-[var(--color-surface)]",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        default: "text-[11px] px-2 py-0.5",
        lg: "text-[12px] px-2.5 py-1",
      },
    },
    defaultVariants: { tone: "neutral", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
