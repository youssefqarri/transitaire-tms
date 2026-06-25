"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Search,
  X,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnFilter =
  | { type: "text"; param: string }
  | { type: "select"; param: string; options: { value: string; label: string }[] };

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
    "w-full h-7 text-[12px] rounded-[var(--radius)] bg-transparent border border-transparent " +
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
          <select
            value={sp.get(filter.param) ?? ""}
            onChange={(e) =>
              push((p) => (e.target.value ? p.set(filter.param, e.target.value) : p.delete(filter.param)))
            }
            aria-label={`Filtrer par ${label}`}
            className={cn(inputCls, "flex-1 px-1.5 font-medium", sp.get(filter.param) ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]")}
          >
            <option value="">{label}</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : shortLabel ? (
          <span className={cn("flex-1 truncate px-1", labelAlign)}>
            <span className="hidden lg:inline">{label}</span>
            <span className="lg:hidden">{shortLabel}</span>
          </span>
        ) : (
          <span className={cn("flex-1 truncate px-1", labelAlign)}>{label}</span>
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
