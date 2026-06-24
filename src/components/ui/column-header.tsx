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
export function ColumnHeader({ label, align = "left", className, sortKey, filter }: Props) {
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
  useEffect(() => setText(urlValue), [urlValue]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onText(v: string) {
    setText(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      push((p) => (v ? p.set(textParam!, v) : p.delete(textParam!)));
    }, 350);
  }

  const inputCls =
    "w-full h-7 text-[12px] rounded-[var(--radius)] bg-transparent border border-transparent " +
    "hover:border-[var(--color-border-2)] focus:bg-[var(--color-surface)] focus:border-[var(--color-accent)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] transition-colors " +
    "placeholder:text-[var(--color-fg-3)] placeholder:font-medium";

  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <th
      className={cn(
        "px-3 py-1.5 align-middle font-medium text-[var(--color-fg-3)]",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <div className={cn("flex items-center gap-0.5", justify)}>
        {filter?.type === "text" ? (
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-1.5 top-1/2 -translate-y-1/2 size-3 text-[var(--color-fg-mute)] pointer-events-none"
              strokeWidth={2}
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
                <X className="size-3" strokeWidth={2.25} />
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
            className={cn(inputCls, "px-1.5 font-medium", sp.get(filter.param) ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]")}
          >
            <option value="">{label}</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="truncate px-1">{label}</span>
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
                <ArrowDownWideNarrow className="size-3.5" strokeWidth={2.25} />
              ) : (
                <ArrowUpNarrowWide className="size-3.5" strokeWidth={2.25} />
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
