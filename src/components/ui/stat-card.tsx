import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
  href?: string;
  /** Couleur d'accentuation (valeur + pastille d'icône). */
  tone?: "default" | "danger" | "warn" | "success";
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
  href,
  tone = "default",
}: Props) {
  const valueClass = cn(
    "text-[24px] leading-none font-semibold tracking-tight tnum",
    tone === "default" && "text-[var(--color-fg)]",
    tone === "danger" && "text-[var(--color-danger)]",
    tone === "warn" && "text-[var(--color-warning)]",
    tone === "success" && "text-[var(--color-success)]",
  );

  // Pastille colorée derrière l'icône — une touche de couleur, mais sobre.
  const tileClass = cn(
    "grid place-items-center size-8 rounded-[var(--radius)] shrink-0",
    tone === "default" && "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    tone === "danger" && "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    tone === "warn" && "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    tone === "success" && "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  );

  const Inner = (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={tileClass}>
          <Icon className="size-4" strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={valueClass}>{value}</span>
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
        <div className="mt-1 flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-medium text-[var(--color-fg-2)] truncate">
            {label}
          </span>
          {hint && (
            <span className="hidden sm:inline text-[11px] text-[var(--color-fg-mute)] truncate">
              · {hint}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const baseCls = cn(
    "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-card",
    "transition-all duration-150",
    href && "hover:border-[var(--color-fg-mute)] hover:shadow-pop group cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(baseCls, "block relative")}>
        {Inner}
        <ArrowUpRight
          className="absolute top-2.5 right-2.5 size-3.5 text-[var(--color-fg-mute)] opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth={2}
        />
      </Link>
    );
  }
  return <div className={baseCls}>{Inner}</div>;
}
