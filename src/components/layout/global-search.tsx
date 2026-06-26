"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Folder, FileText, Receipt, Building2, Truck, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { id: string; title: string; sub: string; href: string };
type Group = { type: string; label: string; total: number; items: Item[] };

const TYPE_ICON: Record<string, LucideIcon> = {
  dossier: Folder,
  dum: FileText,
  facture: Receipt,
  client: Building2,
  fournisseur: Truck,
};

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onChange(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    const trimmed = v.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setLoading(false);
      setOpen(trimmed.length > 0);
      return;
    }
    setLoading(true);
    setOpen(true);
    timer.current = setTimeout(async () => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.current.signal,
        });
        const data = await res.json();
        setGroups(data.groups ?? []);
      } catch {
        /* requête annulée */
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function goAll() {
    if (q.trim().length < 2) return;
    setOpen(false);
    router.push(`/recherche?q=${encodeURIComponent(q.trim())}`);
  }

  const trimmed = q.trim();
  const hasResults = groups.length > 0;

  return (
    <div ref={boxRef} className="relative flex-1 sm:flex-initial sm:w-full sm:max-w-md">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goAll();
        }}
      >
        <label className="relative block">
          <span className="sr-only">Rechercher</span>
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)] pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => trimmed.length > 0 && setOpen(true)}
            placeholder="Rechercher dossiers, DUM, factures, clients…"
            aria-label="Rechercher"
            className="w-full h-9 pl-8 pr-3 text-[13px] bg-[var(--color-surface-2)] border border-transparent rounded-[var(--radius-input)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:bg-[var(--color-surface)] focus:border-[var(--color-border-2)] transition-colors"
          />
        </label>
      </form>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-pop overflow-hidden z-40 animate-scale-in origin-top-left max-h-[75vh] overflow-y-auto">
          {trimmed.length < 2 ? (
            <div className="px-4 py-3 text-[12px] text-[var(--color-fg-mute)]">
              Tapez au moins 2 caractères…
            </div>
          ) : loading ? (
            <div className="px-4 py-3 text-[12px] text-[var(--color-fg-mute)]">Recherche…</div>
          ) : !hasResults ? (
            <div className="px-4 py-3 text-[12px] text-[var(--color-fg-mute)]">
              Aucun résultat pour « {trimmed} ».
            </div>
          ) : (
            <>
              {groups.map((g) => {
                const Icon = TYPE_ICON[g.type] ?? Folder;
                return (
                  <div key={g.type} className="border-b border-[var(--color-border)] last:border-b-0">
                    <div className="px-3 py-1.5 flex items-center justify-between bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-fg-3)]">
                        {g.label}
                      </span>
                      <span className="text-[11px] text-[var(--color-fg-mute)] tnum">{g.total}</span>
                    </div>
                    {g.items.map((it) => (
                      <Link
                        key={it.id}
                        href={it.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <Icon className="size-3.5 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                        <span className="font-mono text-[13px] font-medium text-[var(--color-fg)] shrink-0">
                          {it.title}
                        </span>
                        {it.sub && (
                          <span className="text-[12px] text-[var(--color-fg-3)] truncate">
                            {it.sub}
                          </span>
                        )}
                      </Link>
                    ))}
                    {g.total > g.items.length && (
                      <button
                        type="button"
                        onClick={goAll}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--color-accent)] hover:underline underline-offset-2"
                      >
                        + {g.total - g.items.length} autre{g.total - g.items.length > 1 ? "s" : ""}…
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={goAll}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-medium text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] border-t border-[var(--color-border)]"
              >
                Voir tous les résultats <ArrowRight className="size-3.5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
