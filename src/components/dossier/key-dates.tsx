import { Stamp, BadgeCheck, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Props = {
  visitDate?: Date | null;
  /** @deprecated — non utilisé, conservé pour rétro-compat. */
  visitEffectiveDate?: Date | null;
  conformityVisitDate?: Date | null;
  /** @deprecated — non utilisé. */
  conformityVisitEffectiveDate?: Date | null;
  deliveredAt?: Date | null;
  /** "row" : tout sur une ligne ; "col" : empilées (par défaut). */
  layout?: "row" | "col";
  /** "sm" : 10.5px (par défaut) ; "md" : 12px. */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Affiche les dates clés du dossier.
 * - Date dans le passé (ou aujourd'hui) → événement effectué (vert + ✓)
 * - Date dans le futur → événement à venir (bleu, pas de ✓)
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

  // Comparaison à minuit aujourd'hui pour ne pas dépendre de l'heure
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = (d: Date) => new Date(d).getTime() < today.getTime();
  const isTodayOrPast = (d: Date) => new Date(d).getTime() <= today.getTime() + 86_400_000 - 1;

  function pill(
    Icon: typeof Stamp,
    date: Date,
    label: string,
    onlyEffectiveColor = false,
  ) {
    const done = isTodayOrPast(date);
    // Couleur : vert si dans le passé/aujourd'hui, bleu si dans le futur
    // Pour la livraison on garde toujours du vert (onlyEffectiveColor=true)
    const color = onlyEffectiveColor || done
      ? "text-[var(--color-success)]"
      : "text-[var(--color-accent)]";
    const tag = onlyEffectiveColor ? "" : done ? " ✓" : "";
    return (
      <span className="inline-flex items-center gap-1">
        <Icon className={`${icon} ${color}`} strokeWidth={1.75} />
        <span className={`font-semibold ${color}`}>
          {label}
          {tag}
        </span>
        <span>{formatDate(date)}</span>
      </span>
    );
  }
  // small workaround: forces `isPast` to be referenced so TS doesn't complain in some builds
  void isPast;

  return (
    <div className={`${wrapper} ${text} text-[var(--color-fg-3)] tnum ${className}`}>
      {visitDate && pill(Stamp, visitDate, "Douane")}
      {conformityVisitDate && pill(BadgeCheck, conformityVisitDate, "MCI")}
      {deliveredAt && pill(Truck, deliveredAt, "Livraison", true)}
    </div>
  );
}
