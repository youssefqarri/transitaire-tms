import { cn } from "@/lib/utils";
import { DUM_STATUS_LABELS, DUM_STATUS_TONE } from "@/lib/statuses";
import type { DUMStatus } from "@/generated/prisma/enums";

// Fond doux + couleur de texte par ton (sans bordure, comme le badge de statut dossier).
const TONE_BG: Record<string, string> = {
  neutral: "bg-[oklch(93.5%_0.005_250)] text-[var(--color-fg-2)]",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  ok: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warn: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
};
const TONE_DOT: Record<string, string> = {
  neutral: "bg-[var(--color-fg-mute)]",
  info: "bg-[var(--color-info)]",
  ok: "bg-[var(--color-success)]",
  warn: "bg-[var(--color-warning)]",
  accent: "bg-[var(--color-accent)]",
};

/** Badge de statut DUM : couleur distincte par statut + puce (comme les dossiers). */
export function DumStatusBadge({
  status,
  className,
}: {
  status: DUMStatus;
  className?: string;
}) {
  const tone = DUM_STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap px-2 py-0.5 text-[11px]",
        TONE_BG[tone] ?? TONE_BG.neutral,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("rounded-full shrink-0 size-1.5", TONE_DOT[tone] ?? TONE_DOT.neutral)}
      />
      {DUM_STATUS_LABELS[status]}
    </span>
  );
}
