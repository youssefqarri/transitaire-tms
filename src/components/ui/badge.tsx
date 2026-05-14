import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--color-muted)] text-[var(--color-foreground)] border-transparent",
        info: "bg-[oklch(96%_0.04_230)] text-[oklch(35%_0.15_230)] border-transparent",
        ok: "bg-[oklch(95%_0.07_150)] text-[oklch(35%_0.18_150)] border-transparent",
        warn: "bg-[oklch(96%_0.10_75)] text-[oklch(40%_0.17_60)] border-transparent",
        danger: "bg-[oklch(94%_0.08_25)] text-[oklch(45%_0.22_25)] border-transparent",
        outline: "border-[var(--color-border)] text-[var(--color-foreground)]",
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
