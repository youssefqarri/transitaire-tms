"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

type SelectFilter = {
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

/**
 * Barre de filtre visible uniquement sur mobile (les en-têtes de colonnes
 * triables/filtrables n'existent que sur la vue tableau desktop). Recherche
 * globale (?<searchParam>=) + filtres déroulants optionnels. Réutilisable par
 * toutes les tables converties (utilisateurs, audit, clients, corbeille…).
 */
export function TableMobileFilter({
  searchParam = "q",
  searchPlaceholder = "Rechercher…",
  selects = [],
}: {
  searchParam?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const urlQ = sp.get(searchParam) ?? "";
  const [q, setQ] = useState(urlQ);
  const pushedRef = useRef(urlQ);
  useEffect(() => {
    if (urlQ !== pushedRef.current) {
      pushedRef.current = urlQ;
      setQ(urlQ);
    }
  }, [urlQ]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(mut: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("page");
    start(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  }
  function onQ(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushedRef.current = v;
      push((p) => (v ? p.set(searchParam, v) : p.delete(searchParam)));
    }, 350);
  }

  const field =
    "h-9 bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] " +
    "hover:border-[var(--color-fg-mute)] focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-[var(--color-accent-ring)] focus-visible:border-transparent transition-colors";

  return (
    <div className="md:hidden flex flex-wrap gap-2 px-4 py-3 border-b border-[var(--color-border)]">
      <div className="relative flex-1 min-w-[160px]">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)] pointer-events-none"
          strokeWidth={1.75}
        />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className={`w-full pl-8 pr-8 text-[13px] placeholder:text-[var(--color-fg-mute)] ${field}`}
        />
        {q && (
          <button
            type="button"
            onClick={() => onQ("")}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded text-[var(--color-fg-mute)] hover:text-[var(--color-fg)]"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
      {selects.map((s) => (
        <select
          key={s.param}
          value={sp.get(s.param) ?? ""}
          onChange={(e) =>
            push((p) => (e.target.value ? p.set(s.param, e.target.value) : p.delete(s.param)))
          }
          aria-label={s.placeholder}
          className={`px-2 text-[13px] ${field} ${sp.get(s.param) ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]"}`}
        >
          <option value="">{s.placeholder}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
