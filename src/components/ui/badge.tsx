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
        teal:
          "border-transparent bg-[oklch(95%_0.035_186)] text-[oklch(46%_0.10_186)]",
        purple:
          "border-transparent bg-[oklch(95%_0.03_300)] text-[oklch(48%_0.16_300)]",
        outline:
          "border-[var(--color-border-2)] text-[var(--color-fg-2)] bg-transparent",
        solid:
          "border-transparent bg-[var(--color-fg)] text-[var(--color-surface)]",
      },
      size: {
        sm: "text-[11px] px-1.5 py-0.5",
        default: "text-[11px] px-2 py-0.5",
        lg: "text-[12px] px-2.5 py-1",
      },
    },
    defaultVariants: { tone: "neutral", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Puce ronde (couleur = celle du tone) à gauche du libellé, comme les statuts dossier. */
  dot?: boolean;
}

export function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), dot && "gap-1.5", className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}
