import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

const TONE_CLASS: Record<string, string> = {
  neutral: "border-[var(--color-ink-soft)] text-[var(--color-ink-soft)]",
  info:    "border-[var(--color-archive)] text-[var(--color-archive)]",
  ok:      "border-[var(--color-leaf)] text-[var(--color-leaf)]",
  warn:    "border-[oklch(45%_0.18_50)] text-[oklch(45%_0.18_50)]",
  danger:  "border-[var(--color-stamp)] text-[var(--color-stamp)]",
};

// statut = tampon officiel (légère rotation, bord double)
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
        "stamp",
        TONE_CLASS[tone] ?? TONE_CLASS.neutral,
        size === "sm" && "text-[9.5px] !px-1.5",
        className,
      )}
      style={{ transform: "rotate(-0.6deg)" }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
