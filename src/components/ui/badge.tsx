import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.10em] border",
  {
    variants: {
      tone: {
        neutral:
          "border-[var(--color-rule-strong)] text-[var(--color-ink-soft)] bg-transparent",
        info:
          "border-[var(--color-archive)] text-[var(--color-archive)] bg-[var(--color-archive-soft)]/40",
        ok:
          "border-[var(--color-leaf)] text-[var(--color-leaf)] bg-[var(--color-leaf-soft)]/40",
        warn:
          "border-[oklch(58%_0.16_60)] text-[oklch(45%_0.16_55)] bg-[oklch(96%_0.08_70)]/60",
        danger:
          "border-[var(--color-destructive)] text-[var(--color-destructive)] bg-[oklch(96%_0.05_25)]/60",
        outline:
          "border-[var(--color-rule)] text-[var(--color-ink-mute)] bg-transparent",
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
