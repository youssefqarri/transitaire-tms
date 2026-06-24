import { Stamp, BadgeCheck, Truck, Clock } from "lucide-react";
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

  const text = size === "sm" ? "text-[11px]" : "text-[12px]";
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
    const isDone = onlyEffectiveColor || done;
    // Vert = effectué (le vert suffit, pas de ✓). Bleu + horloge = à venir.
    const color = isDone ? "text-[var(--color-success)]" : "text-[var(--color-info)]";
    const PillIcon = isDone ? Icon : Clock;
    // Événements externes (douane, contrôle, livraison) : on n'affiche que la date.
    const title = isDone
      ? `${label} : effectué le ${formatDate(date)}`
      : `${label} : prévu le ${formatDate(date)} (à venir)`;
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap" title={title}>
        <PillIcon className={`${icon} ${color}`} strokeWidth={1.75} />
        <span className={`font-semibold ${color}`}>{label}</span>
        <span>{formatDate(date)}</span>
      </span>
    );
  }
  // small workaround: forces `isPast` to be referenced so TS doesn't complain in some builds
  void isPast;

  return (
    <div className={`${wrapper} ${text} text-[var(--color-fg-3)] tnum ${className}`}>
      {visitDate && pill(Stamp, visitDate, "Douane")}
      {conformityVisitDate && pill(BadgeCheck, conformityVisitDate, "Contrôle")}
      {deliveredAt && pill(Truck, deliveredAt, "Livraison", true)}
    </div>
  );
}

/** Légende discrète du code couleur des dates clés (vert = effectué, bleu = à venir). */
export function KeyDatesLegend({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-[11px] text-[var(--color-fg-3)] ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <span
          className="size-1.5 rounded-full bg-[var(--color-success)]"
          aria-hidden
        />
        Effectué
      </span>
      <span className="inline-flex items-center gap-1">
        <span
          className="size-1.5 rounded-full bg-[var(--color-info)]"
          aria-hidden
        />
        À venir
      </span>
    </span>
  );
}
