import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "primary" | "warn" | "ok" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "from-[oklch(96%_0.005_240)] to-[oklch(98%_0.005_240)] text-[var(--color-foreground)]",
    primary: "from-[oklch(95%_0.08_258)] to-[oklch(98%_0.03_258)] text-[oklch(35%_0.18_258)]",
    warn: "from-[oklch(96%_0.10_75)] to-[oklch(98%_0.04_75)] text-[oklch(40%_0.17_60)]",
    ok: "from-[oklch(95%_0.08_150)] to-[oklch(98%_0.03_150)] text-[oklch(35%_0.18_150)]",
    info: "from-[oklch(95%_0.06_230)] to-[oklch(98%_0.02_230)] text-[oklch(35%_0.15_230)]",
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
            {label}
          </div>
          <div className="text-2xl font-semibold tracking-tight mt-2">{value}</div>
          {hint && <div className="text-xs text-[var(--color-muted-foreground)] mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div
            className={cn(
              "size-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              tones[tone],
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
