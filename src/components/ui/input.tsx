import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const baseCls = [
  "flex h-9 w-full px-3 text-[13px]",
  "bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)]",
  "placeholder:text-[var(--color-fg-mute)]",
  "transition-shadow duration-150",
  "hover:border-[var(--color-fg-mute)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)]",
  "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-danger)]/20",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-2)]",
  "file:border-0 file:bg-transparent file:text-[14px] file:font-medium file:mr-3",
];

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    // Champs date : rendu cohérent et soigné — icône calendrier propre,
    // indicateur natif masqué (mais cliquable à droite pour ouvrir le sélecteur).
    if (type === "date" || type === "datetime-local" || type === "month") {
      return (
        <div className="relative w-full">
          <input
            type={type}
            ref={ref}
            className={cn(
              baseCls,
              "pr-9 tnum [color-scheme:light]",
              // l'indicateur natif devient une zone cliquable invisible à droite
              "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
              className,
            )}
            {...props}
          />
          <Calendar
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fg-mute)]"
            strokeWidth={1.75}
          />
        </div>
      );
    }
    return <input type={type} ref={ref} className={cn(baseCls, className)} {...props} />;
  },
);
Input.displayName = "Input";
