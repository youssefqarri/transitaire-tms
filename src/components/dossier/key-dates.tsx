import { Stamp, BadgeCheck, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Props = {
  visitDate?: Date | null;
  conformityVisitDate?: Date | null;
  deliveredAt?: Date | null;
  /** "row" : tout sur une ligne ; "col" : empilées (par défaut). */
  layout?: "row" | "col";
  /** "sm" : 10.5px (par défaut) ; "md" : 12px. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Affiche les dates clés d'un dossier (visite douane, visite MCI, livraison)
 * avec icônes et libellés pour les différencier.
 */
export function KeyDates({
  visitDate,
  conformityVisitDate,
  deliveredAt,
  layout = "col",
  size = "sm",
  className = "",
}: Props) {
  if (!visitDate && !conformityVisitDate && !deliveredAt) return null;

  const text = size === "sm" ? "text-[10.5px]" : "text-[12px]";
  const icon = size === "sm" ? "size-2.5" : "size-3";
  const wrapper =
    layout === "row" ? "flex flex-wrap gap-x-2 gap-y-0.5" : "flex flex-col gap-0.5";

  return (
    <div
      className={`${wrapper} ${text} text-[var(--color-fg-3)] tnum ${className}`}
    >
      {visitDate && (
        <span className="inline-flex items-center gap-1">
          <Stamp className={`${icon} text-[var(--color-fg-2)]`} strokeWidth={1.75} />
          <span className="font-semibold text-[var(--color-fg-2)]">Douane</span>
          <span>{formatDate(visitDate)}</span>
        </span>
      )}
      {conformityVisitDate && (
        <span className="inline-flex items-center gap-1">
          <BadgeCheck className={`${icon} text-[var(--color-fg-2)]`} strokeWidth={1.75} />
          <span className="font-semibold text-[var(--color-fg-2)]">MCI</span>
          <span>{formatDate(conformityVisitDate)}</span>
        </span>
      )}
      {deliveredAt && (
        <span className="inline-flex items-center gap-1">
          <Truck className={`${icon} text-[var(--color-fg-2)]`} strokeWidth={1.75} />
          <span className="font-semibold text-[var(--color-fg-2)]">Livraison</span>
          <span>{formatDate(deliveredAt)}</span>
        </span>
      )}
    </div>
  );
}
