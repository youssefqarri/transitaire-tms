import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-fg-2)] before:bg-[var(--color-fg-mute)]",
  info:    "bg-[var(--color-info-soft)] text-[var(--color-info)] before:bg-[var(--color-info)]",
  ok:      "bg-[var(--color-success-soft)] text-[var(--color-success)] before:bg-[var(--color-success)]",
  warn:    "bg-[var(--color-warning-soft)] text-[var(--color-warning)] before:bg-[var(--color-warning)]",
  danger:  "bg-[var(--color-danger-soft)] text-[var(--color-danger)] before:bg-[var(--color-danger)]",
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
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        "before:content-[''] before:block before:size-1.5 before:rounded-full",
        TONE_CLASS[tone] ?? TONE_CLASS.neutral,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
