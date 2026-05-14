import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-mono text-[11px] font-medium uppercase tracking-[0.12em]",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] focus-visible:ring-[var(--color-ink)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
    "active:translate-y-[1px]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-ink)] hover:bg-[oklch(25%_0.02_50)]",
        destructive:
          "bg-[var(--color-destructive)] text-[var(--color-paper)] border border-[var(--color-destructive)]",
        outline:
          "border border-[var(--color-rule-strong)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-paper-strong)]",
        secondary:
          "bg-[var(--color-paper-strong)] text-[var(--color-ink)] border border-[var(--color-rule)] hover:bg-[oklch(92%_0.02_75)]",
        ghost:
          "text-[var(--color-ink)] hover:bg-[var(--color-paper-strong)]",
        link: "text-[var(--color-ink)] underline underline-offset-4 decoration-[var(--color-rule-strong)] hover:decoration-[var(--color-ink)] normal-case tracking-normal font-sans text-[13px]",
        stamp:
          "border border-[var(--color-stamp)] text-[var(--color-stamp)] bg-transparent hover:bg-[var(--color-stamp-soft)]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-11 px-6 text-[12px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
