import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
    "rounded-[var(--radius)] text-[13px] font-medium",
    "transition-all duration-150 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-fg)] text-[var(--color-surface)] hover:bg-[var(--color-fg-hover)] shadow-[var(--shadow-sm)]",
        destructive:
          "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)] shadow-[var(--shadow-sm)]",
        outline:
          "border border-[var(--color-border-2)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-fg-mute)]",
        secondary:
          "bg-[var(--color-surface-2)] text-[var(--color-fg)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)]",
        ghost:
          "text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
        success:
          "bg-[var(--color-success)] text-white hover:bg-[var(--color-success-hover)] shadow-[var(--shadow-sm)]",
        // Variantes « soft » : fond tinté léger + texte/icône coloré, SANS ombre.
        // Pour donner de la couleur aux actions (édition, suppression, envoi…).
        soft: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:brightness-95",
        "soft-danger":
          "bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-95",
        "soft-success":
          "bg-[var(--color-success-soft)] text-[var(--color-success)] hover:brightness-95",
        "soft-warning":
          "bg-[var(--color-warning-soft)] text-[var(--color-warning)] hover:brightness-95",
        link:
          "text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-5 text-[14px]",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 [&_svg]:size-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, title, "aria-label": ariaLabel, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      // Tooltip natif au survol : reprend le aria-label si aucun title explicite
      // (couvre tous les boutons-icônes de l'app).
      title={title ?? ariaLabel}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
