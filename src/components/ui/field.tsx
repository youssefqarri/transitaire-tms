import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Couple label / valeur — LA convention typographique unique de l'app (fiches
 * détail, panneaux, grilles d'infos). Source unique de vérité pour garder une
 * hiérarchie harmonieuse partout :
 *   - label  : 12px, medium, gris tertiaire (fg-3)
 *   - valeur : 13px, texte principal (fg), chiffres tabulaires (tnum) pour un
 *              rendu numérique homogène (montants/dates/quantités alignés)
 *
 * `strong` accentue la valeur (font-semibold) ; `mono` est accepté pour
 * compat mais ne change rien de visible (la police « mono » = Geist + tnum,
 * déjà le rendu par défaut des valeurs).
 */
export function Field({
  label,
  value,
  strong = false,
  mono = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[12px] font-medium text-[var(--color-fg-3)]">{label}</div>
      <div
        className={cn(
          "mt-1 text-[13px] text-[var(--color-fg)] tnum",
          strong && "font-semibold",
          mono && "font-mono",
        )}
      >
        {value}
      </div>
    </div>
  );
}
