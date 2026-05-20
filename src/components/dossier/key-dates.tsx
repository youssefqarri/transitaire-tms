import { Stamp, BadgeCheck, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Props = {
  visitDate?: Date | null;
  visitEffectiveDate?: Date | null;
  conformityVisitDate?: Date | null;
  conformityVisitEffectiveDate?: Date | null;
  deliveredAt?: Date | null;
  /** "row" : tout sur une ligne ; "col" : empilées (par défaut). */
  layout?: "row" | "col";
  /** "sm" : 10.5px (par défaut) ; "md" : 12px. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Affiche les dates clés d'un dossier avec icônes et libellés.
 * Visite douane / MCI : peuvent avoir une date prévue ET une date effective.
 * Quand une date effective existe, on affiche celle-ci avec un point vert ;
 * sinon on affiche la date prévue en bleu.
 */
export function KeyDates({
  visitDate,
  visitEffectiveDate,
  conformityVisitDate,
  conformityVisitEffectiveDate,
  deliveredAt,
  layout = "col",
  size = "sm",
  className = "",
}: Props) {
  const hasAny =
    visitDate ||
    visitEffectiveDate ||
    conformityVisitDate ||
    conformityVisitEffectiveDate ||
    deliveredAt;
  if (!hasAny) return null;

  const text = size === "sm" ? "text-[10.5px]" : "text-[12px]";
  const icon = size === "sm" ? "size-2.5" : "size-3";
  const wrapper =
    layout === "row" ? "flex flex-wrap gap-x-2 gap-y-0.5" : "flex flex-col gap-0.5";

  // Pour chaque visite, on choisit : effective si fournie, sinon prévue
  const visitShown = visitEffectiveDate ?? visitDate;
  const visitDone = !!visitEffectiveDate;
  const mciShown = conformityVisitEffectiveDate ?? conformityVisitDate;
  const mciDone = !!conformityVisitEffectiveDate;

  return (
    <div
      className={`${wrapper} ${text} text-[var(--color-fg-3)] tnum ${className}`}
    >
      {visitShown && (
        <span className="inline-flex items-center gap-1">
          <Stamp
            className={`${icon} ${visitDone ? "text-[var(--color-success)]" : "text-[var(--color-fg-2)]"}`}
            strokeWidth={1.75}
          />
          <span
            className={`font-semibold ${visitDone ? "text-[var(--color-success)]" : "text-[var(--color-fg-2)]"}`}
          >
            Douane{visitDone ? " ✓" : ""}
          </span>
          <span>{formatDate(visitShown)}</span>
        </span>
      )}
      {mciShown && (
        <span className="inline-flex items-center gap-1">
          <BadgeCheck
            className={`${icon} ${mciDone ? "text-[var(--color-success)]" : "text-[var(--color-fg-2)]"}`}
            strokeWidth={1.75}
          />
          <span
            className={`font-semibold ${mciDone ? "text-[var(--color-success)]" : "text-[var(--color-fg-2)]"}`}
          >
            MCI{mciDone ? " ✓" : ""}
          </span>
          <span>{formatDate(mciShown)}</span>
        </span>
      )}
      {deliveredAt && (
        <span className="inline-flex items-center gap-1">
          <Truck className={`${icon} text-[var(--color-success)]`} strokeWidth={1.75} />
          <span className="font-semibold text-[var(--color-success)]">Livraison</span>
          <span>{formatDate(deliveredAt)}</span>
        </span>
      )}
    </div>
  );
}
