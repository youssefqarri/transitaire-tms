import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
    "rounded-[var(--radius)] text-[13px] font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-fg)] text-[var(--color-surface)] hover:bg-[oklch(25%_0.01_250)] shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        destructive:
          "bg-[var(--color-danger)] text-white hover:bg-[oklch(45%_0.20_25)]",
        outline:
          "border border-[var(--color-border-2)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
        secondary:
          "bg-[var(--color-surface-2)] text-[var(--color-fg)] hover:bg-[oklch(94%_0.005_250)] border border-[var(--color-border)]",
        ghost:
          "text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
        link:
          "text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-5",
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
