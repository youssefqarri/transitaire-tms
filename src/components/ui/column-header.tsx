"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Search,
  X,
  ChevronDown,
  CalendarDays,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

export type ColumnFilter =
  | { type: "text"; param: string }
  | { type: "select"; param: string; options: { value: string; label: string }[] }
  | { type: "date"; fromParam: string; toParam: string };

type Props = {
  label: string;
  /** Libellé court affiché sur écrans étroits (< lg), si l'espace manque. */
  shortLabel?: string;
  align?: "left" | "right" | "center";
  /** Classe(s) de largeur/padding pour le <th>. */
  className?: string;
  /** Si défini, la colonne est triable (clé envoyée dans ?sort=). */
  sortKey?: string;
  /** Si défini, la colonne est filtrable (texte ou liste). */
  filter?: ColumnFilter;
};

/**
 * En-tête de colonne réutilisable : tri (clic cyclique desc → asc → défaut) +
 * filtre par colonne (champ texte ou liste déroulante). Le filtre/tri est porté
 * par l'URL (?sort=&dir=&<param>=). Bordure au survol, champ actif au focus.
 * Le tri par défaut de la table est conservé tant qu'aucune colonne n'est triée.
 */
export function ColumnHeader({ label, shortLabel, align = "left", className, sortKey, filter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const curSort = sp.get("sort");
  const curDir = sp.get("dir") === "asc" ? "asc" : "desc";
  const sorted = !!sortKey && curSort === sortKey;

  function push(mut: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("page"); // tout changement de filtre/tri ramène en page 1
    startTransition(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  }

  function toggleSort() {
    if (!sortKey) return;
    push((p) => {
      if (curSort !== sortKey) {
        p.set("sort", sortKey);
        p.set("dir", "desc");
      } else if (curDir === "desc") {
        p.set("dir", "asc");
      } else {
        p.delete("sort");
        p.delete("dir");
      }
    });
  }

  // --- filtre texte (débounce) ---
  const textParam = filter?.type === "text" ? filter.param : undefined;
  const urlValue = textParam ? sp.get(textParam) ?? "" : "";
  const [text, setText] = useState(urlValue);
  // Mémorise la dernière valeur qu'ON a poussée : on ne resynchronise depuis l'URL
  // que sur navigation EXTERNE (back/forward), jamais sur nos propres push — sinon
  // vider le champ pouvait le re-remplir avec l'ancienne valeur (bug mobile).
  const pushedRef = useRef(urlValue);
  useEffect(() => {
    if (urlValue !== pushedRef.current) {
      pushedRef.current = urlValue;
      setText(urlValue);
    }
  }, [urlValue]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onText(v: string) {
    setText(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushedRef.current = v;
      push((p) => (v ? p.set(textParam!, v) : p.delete(textParam!)));
    }, 350);
  }

  const inputCls =
    "w-full h-7 text-[12px] rounded-[var(--radius-input)] bg-transparent border border-transparent " +
    "hover:border-[var(--color-border-2)] focus:bg-[var(--color-surface)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] transition-colors " +
    "placeholder:text-[var(--color-fg-3)] placeholder:font-medium";

  // Le libellé/filtre prend toute la largeur (flex-1) → le bouton de tri est
  // toujours collé à droite (juste avant le séparateur de la colonne suivante).
  const labelAlign =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <th
      className={cn(
        "relative px-3 py-1.5 align-middle font-medium text-[var(--color-fg-3)]",
        // séparateur : un fin pipe court et centré (pas une bordure pleine)
        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-px before:bg-[var(--color-border-2)] first:before:hidden",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {filter?.type === "text" ? (
          <div className="relative flex-1 min-w-[88px]">
            <Search
              className="absolute left-1.5 top-1/2 -translate-y-1/2 size-3 text-[var(--color-fg-mute)] pointer-events-none"
              strokeWidth={1.75}
            />
            <input
              value={text}
              onChange={(e) => onText(e.target.value)}
              placeholder={label}
              aria-label={`Filtrer par ${label}`}
              className={cn(inputCls, "pl-6", text ? "pr-6" : "pr-2")}
            />
            {text && (
              <button
                type="button"
                onClick={() => onText("")}
                aria-label="Effacer le filtre"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-4 grid place-items-center rounded text-[var(--color-fg-mute)] hover:text-[var(--color-fg)]"
              >
                <X className="size-3" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ) : filter?.type === "select" ? (
          filter.options.length > 10 ? (
            <Combobox
              size="sm"
              clearable
              items={filter.options.map((o) => ({ id: o.value, label: o.label }))}
              value={sp.get(filter.param) ?? ""}
              onChange={(v) => push((p) => (v ? p.set(filter.param, v) : p.delete(filter.param)))}
              placeholder={label}
              searchPlaceholder="Filtrer…"
              emptyText="Aucun résultat"
              className="flex-1"
            />
          ) : (
          <div className="relative flex-1">
            <select
              value={sp.get(filter.param) ?? ""}
              onChange={(e) =>
                push((p) => (e.target.value ? p.set(filter.param, e.target.value) : p.delete(filter.param)))
              }
              aria-label={`Filtrer par ${label}`}
              className={cn(inputCls, "appearance-none pl-1.5 pr-6 font-medium", sp.get(filter.param) ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]")}
            >
              <option value="">{label}</option>
              {filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]"
              strokeWidth={1.75}
            />
          </div>
          )
        ) : shortLabel ? (
          <span className={cn("flex-1 truncate px-1", labelAlign)}>
            <span className="hidden lg:inline">{label}</span>
            <span className="lg:hidden">{shortLabel}</span>
          </span>
        ) : (
          <span className={cn("flex-1 truncate px-1", labelAlign)}>{label}</span>
        )}

        {filter?.type === "date" && (
          <DateRangeFilter fromParam={filter.fromParam} toParam={filter.toParam} />
        )}

        {sortKey && (
          <button
            type="button"
            onClick={toggleSort}
            aria-label={`Trier par ${label}`}
            title={`Trier par ${label}`}
            className={cn(
              "shrink-0 size-6 grid place-items-center rounded hover:bg-[var(--color-surface-2)] transition-colors",
              sorted ? "text-[var(--color-accent)]" : "text-[var(--color-fg-mute)]",
            )}
          >
            {sorted ? (
              curDir === "desc" ? (
                <ArrowDownWideNarrow className="size-3.5" strokeWidth={1.75} />
              ) : (
                <ArrowUpNarrowWide className="size-3.5" strokeWidth={1.75} />
              )
            ) : (
              <ArrowUpDown className="size-3.5" strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>
    </th>
  );
}

/** Filtre période « Du / Au » (heure optionnelle) porté par l'URL (?from=&to=). */
function DateRangeFilter({ fromParam, toParam }: { fromParam: string; toParam: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const curFrom = sp.get(fromParam) ?? "";
  const curTo = sp.get(toParam) ?? "";
  const [fromDate, setFromDate] = useState(curFrom.slice(0, 10));
  const [fromTime, setFromTime] = useState(curFrom.slice(11, 16));
  const [toDate, setToDate] = useState(curTo.slice(0, 10));
  const [toTime, setToTime] = useState(curTo.slice(11, 16));
  const active = !!curFrom || !!curTo;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function commit(next: URLSearchParams) {
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setOpen(false);
  }
  function apply() {
    const p = new URLSearchParams(sp.toString());
    const from = fromDate ? `${fromDate}T${fromTime || "00:00"}` : "";
    const to = toDate ? `${toDate}T${toTime || "23:59"}` : "";
    if (from) p.set(fromParam, from);
    else p.delete(fromParam);
    if (to) p.set(toParam, to);
    else p.delete(toParam);
    commit(p);
  }
  function clear() {
    setFromDate("");
    setFromTime("");
    setToDate("");
    setToTime("");
    const p = new URLSearchParams(sp.toString());
    p.delete(fromParam);
    p.delete(toParam);
    commit(p);
  }

  const fieldCls =
    "h-8 px-2 text-[12px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius-input)] [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)]";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Filtrer par date"
        title="Filtrer par date"
        className={cn(
          "size-6 grid place-items-center rounded hover:bg-[var(--color-surface-2)] transition-colors",
          active ? "text-[var(--color-accent)]" : "text-[var(--color-fg-mute)]",
        )}
      >
        <CalendarDays className="size-3.5" strokeWidth={1.75} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-[248px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] p-3 space-y-2.5 text-left font-normal animate-fade-in">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[var(--color-fg-3)] uppercase tracking-wide">Du</div>
            <div className="flex gap-1.5">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={cn(fieldCls, "flex-1 min-w-0")} />
              <input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} className={cn(fieldCls, "w-[82px]")} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[var(--color-fg-3)] uppercase tracking-wide">Au</div>
            <div className="flex gap-1.5">
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={cn(fieldCls, "flex-1 min-w-0")} />
              <input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} className={cn(fieldCls, "w-[82px]")} />
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-fg-mute)]">L&apos;heure est optionnelle.</p>
          <div className="flex items-center justify-between pt-0.5">
            <button type="button" onClick={clear} className="text-[12px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]">
              Effacer
            </button>
            <button type="button" onClick={apply} className="h-7 px-3 text-[12px] font-medium rounded-[var(--radius-input)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:brightness-95">
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
