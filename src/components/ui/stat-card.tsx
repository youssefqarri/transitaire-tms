import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// stat éditoriale : numéro grand sérif + label mono + petit pictogramme discret
export function StatCard({
  index,
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  index?: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "stamp" | "archive" | "leaf";
  className?: string;
}) {
  const accents = {
    neutral: "text-[var(--color-ink)]",
    stamp:   "text-[var(--color-stamp)]",
    archive: "text-[var(--color-archive)]",
    leaf:    "text-[var(--color-leaf)]",
  } as const;

  return (
    <div
      className={cn(
        "relative bg-[var(--color-card)] border border-[var(--color-rule)] px-6 py-5",
        "before:absolute before:left-0 before:top-0 before:h-[3px] before:w-10 before:bg-[var(--color-ink)]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          {(index || label) && (
            <div className="flex items-center gap-3">
              {index && (
                <span className="label-eyebrow text-[var(--color-ink)]">N° {index}</span>
              )}
              <span className="label-eyebrow">{label}</span>
            </div>
          )}
          <div
            className={cn(
              "font-display text-[42px] leading-none tnum",
              accents[tone],
            )}
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 500' }}
          >
            {value}
          </div>
          {hint && (
            <div className="text-[12px] text-[var(--color-ink-mute)] font-sans">{hint}</div>
          )}
        </div>
        {Icon && (
          <Icon
            className={cn("size-4 mt-1 opacity-40", accents[tone])}
            strokeWidth={1.5}
          />
        )}
      </div>
    </div>
  );
}
