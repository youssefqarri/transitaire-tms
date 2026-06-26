import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

const TONE_BG: Record<string, string> = {
  neutral: "bg-[oklch(93.5%_0.005_250)] text-[var(--color-fg-2)]",
  info:    "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  ok:      "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warn:    "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger:  "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const TONE_DOT: Record<string, string> = {
  neutral: "bg-[var(--color-fg-mute)]",
  info:    "bg-[var(--color-info)]",
  ok:      "bg-[var(--color-success)]",
  warn:    "bg-[var(--color-warning)]",
  danger:  "bg-[var(--color-danger)]",
};

export function StatusBadge({
  status,
  className,
  size = "md",
  wrap = false,
  title,
}: {
  status: DossierStatus;
  className?: string;
  size?: "sm" | "md";
  /** Autorise le libellé à passer à la ligne (utile pour les longs statuts en colonne étroite). */
  wrap?: boolean;
  /** Infobulle « quand » au survol (ex. « Visite prévue le … ») — voir statusTiming(). */
  title?: string;
}) {
  const tone = STATUS_TONE[status];
  return (
    <span
      title={title}
      className={cn(
        "inline-flex gap-1.5 rounded-full font-medium",
        wrap ? "items-start text-left" : "items-center whitespace-nowrap",
        TONE_BG[tone] ?? TONE_BG.neutral,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "rounded-full shrink-0 size-1.5",
          wrap && "mt-[5px]",
          TONE_DOT[tone] ?? TONE_DOT.neutral,
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
