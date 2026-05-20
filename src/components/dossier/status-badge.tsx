import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

const TONE_BG: Record<string, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-fg-2)] ring-1 ring-[var(--color-border-2)]",
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
}: {
  status: DossierStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        TONE_BG[tone] ?? TONE_BG.neutral,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "rounded-full shrink-0",
          size === "sm" ? "size-1.5" : "size-1.5",
          TONE_DOT[tone] ?? TONE_DOT.neutral,
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
