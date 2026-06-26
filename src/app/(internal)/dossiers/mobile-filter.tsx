"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

/**
 * Barre de filtre visible uniquement sur mobile (les en-têtes de colonnes
 * triables/filtrables n'existent que sur la vue tableau desktop). Recherche
 * globale (n°/réf/client/DUM via ?q=) + filtre statut.
 */
export function DossiersMobileFilter({
  statusOptions,
}: {
  statusOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const urlQ = sp.get("q") ?? "";
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
      push((p) => (v ? p.set("q", v) : p.delete("q")));
    }, 350);
  }

  const field =
    "h-9 bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius-input)] " +
    "hover:border-[var(--color-fg-mute)] focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-[var(--color-accent-ring)] transition-colors";

  return (
    <div className="md:hidden flex gap-2 px-4 py-3 border-b border-[var(--color-border)]">
      <div className="relative flex-1 min-w-0">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)] pointer-events-none"
          strokeWidth={1.75}
        />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Rechercher…"
          aria-label="Rechercher un dossier"
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
      <select
        value={sp.get("status") ?? ""}
        onChange={(e) =>
          push((p) => (e.target.value ? p.set("status", e.target.value) : p.delete("status")))
        }
        aria-label="Filtrer par statut"
        className={`px-2 text-[13px] max-w-[42%] ${field} ${sp.get("status") ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]"}`}
      >
        <option value="">Tous statuts</option>
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
