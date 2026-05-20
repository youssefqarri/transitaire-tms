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
  /** Couleur d'accentuation pour la valeur ("danger" pour les alertes, etc.). */
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
    "text-[28px] font-semibold tracking-tight tnum",
    tone === "default" && "text-[var(--color-fg)]",
    tone === "danger" && "text-[var(--color-danger)]",
    tone === "warn" && "text-[var(--color-warning)]",
    tone === "success" && "text-[var(--color-success)]",
  );

  const Inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--color-fg-3)]">{label}</span>
        {Icon && (
          <Icon className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className={valueClass}>{value}</div>
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
    </>
  );

  const baseCls = cn(
    "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card",
    "transition-all duration-150",
    href && "hover:border-[var(--color-fg-mute)] hover:shadow-pop group cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(baseCls, "block relative")}>
        {Inner}
        <ArrowUpRight
          className="absolute top-3 right-3 size-3.5 text-[var(--color-fg-mute)] opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth={2}
        />
      </Link>
    );
  }
  return <div className={baseCls}>{Inner}</div>;
}
