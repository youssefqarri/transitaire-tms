import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--color-fg-3)]">{label}</span>
        {Icon && (
          <Icon className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="text-[28px] font-semibold tracking-tight text-[var(--color-fg)] tnum">
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-medium tnum",
              trend.positive ? "text-[var(--color-success)]" : "text-[var(--color-fg-3)]",
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {hint && (
        <div className="mt-1 text-[12px] text-[var(--color-fg-3)]">{hint}</div>
      )}
    </div>
  );
}
