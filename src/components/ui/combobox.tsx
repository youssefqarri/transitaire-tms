"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxItem = {
  id: string;
  label: string;
  sublabel?: string;
  /** Si true, l'option est affichée en haut avec un séparateur avant le reste. */
  pinned?: boolean;
};

type Props = {
  items: ComboboxItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  id?: string;
  /** Taille du bouton déclencheur. "sm" = compact (h-7), "default" = h-9. */
  size?: "sm" | "default";
  /** Si false, masque le champ de recherche (liste seule). Défaut true. */
  searchable?: boolean;
  /** « bare » : pas de bordure/fond au repos (comme un input texte de filtre), bordure au survol/ouverture. */
  bare?: boolean;
  /** Opt-in : si fourni, propose « Ajouter « <saisie> » » quand la saisie ne correspond à aucune entrée. */
  onCreate?: (label: string) => void;
};

export const Combobox = forwardRef<HTMLButtonElement, Props>(function Combobox(
  {
    items,
    value,
    onChange,
    placeholder = "Sélectionner…",
    emptyText = "Aucun résultat",
    searchPlaceholder = "Rechercher…",
    disabled,
    clearable = false,
    className,
    id,
    size = "default",
    searchable = true,
    bare = false,
    onCreate,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Le menu est rendu dans un portal (position: fixed) pour échapper à tout
  // conteneur `overflow` parent (ex. table `overflow-x-auto`) qui le tronquerait.
  // On mesure le trigger et on positionne le menu sous (ou au-dessus) de lui.
  const [pos, setPos] = useState<
    { left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null
  >(null);
  const updatePosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, 288); // min-w 18rem
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 320 && spaceAbove > spaceBelow;
    setPos({
      left,
      width,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.max(180, (openUp ? spaceAbove : spaceBelow) - 16),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  const selected = useMemo(() => items.find((it) => it.id === value), [items, value]);

  // Recherche insensible à la casse ET aux accents : « e » matche « é/è/ê/ë », et inversement.
  const normSearch = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const filtered = useMemo(() => {
    const q = normSearch(query.trim());
    if (!q) return items;
    return items.filter(
      (it) =>
        normSearch(it.label).includes(q) ||
        (it.sublabel ? normSearch(it.sublabel).includes(q) : false),
    );
  }, [items, query]);

  // Création opt-in : on propose d'ajouter la saisie si elle ne matche aucune entrée existante.
  const trimmedQuery = query.trim();
  const hasExact = useMemo(
    () => items.some((it) => normSearch(it.label) === normSearch(trimmedQuery)),
    [items, trimmedQuery],
  );
  const showCreate = !!onCreate && trimmedQuery.length > 0 && !hasExact;

  // close on click outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      // le menu est portalisé hors du container → tester les deux
      if (!containerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // close on Escape (utile surtout sans champ de recherche pour capter la touche)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // focus search when opening, reset state when closing
  useEffect(() => {
    if (open) {
      const t = searchable ? setTimeout(() => inputRef.current?.focus(), 0) : undefined;
      setActiveIdx(0);
      return () => {
        if (t) clearTimeout(t);
      };
    } else {
      setQuery("");
    }
  }, [open, searchable]);

  // keep active item visible
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[activeIdx];
        if (item) {
          onChange(item.id);
          setOpen(false);
        } else if (showCreate && onCreate) {
          onCreate(trimmedQuery);
          setOpen(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [filtered, activeIdx, onChange, showCreate, onCreate, trimmedQuery],
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={ref}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          size === "sm"
            ? "relative group flex h-7 w-full items-center pl-2 text-[12px] text-left"
            : "relative group flex h-9 w-full items-center pl-3 text-[13px] text-left",
          "rounded-[var(--radius-input)] transition-shadow duration-150",
          // « bare » (filtres d'en-tête) : transparent au repos comme un input texte ;
          // bordure au survol, fond + bordure une fois ouvert.
          bare
            ? "bg-transparent border border-transparent hover:border-[var(--color-border-2)]"
            : "bg-[var(--color-surface)] border border-[var(--color-border-2)] hover:border-[var(--color-fg-mute)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-2)]",
          open && (bare ? "bg-[var(--color-surface)] border-[var(--color-border-2)]" : "border-[var(--color-fg-mute)]"),
          clearable && selected && !disabled ? "pr-14" : "pr-8",
        )}
      >
        <span
          className={cn(
            "flex-1 min-w-0 truncate",
            selected ? "text-[var(--color-fg)]" : "text-[var(--color-fg-mute)]",
          )}
        >
          {selected ? (
            <>
              {selected.label}
              {selected.sublabel && (
                <span className="ml-1.5 text-[var(--color-fg-mute)] text-[12px]">
                  • {selected.sublabel}
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            aria-label="Effacer la sélection"
            title="Effacer la sélection"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-7 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-2)] text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] cursor-pointer"
          >
            <X className="size-3" strokeWidth={1.75} />
          </span>
        )}
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--color-fg-mute)] transition-transform",
            size === "sm" ? "right-2 size-3" : "right-3 size-3.5",
            open && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          className="z-[200] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in flex flex-col"
        >
          {searchable && (
            <div className="relative border-b border-[var(--color-border)]">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]"
                strokeWidth={1.75}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={onKey}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-8 pr-3 text-[13px] bg-transparent placeholder:text-[var(--color-fg-mute)] focus:outline-none"
              />
            </div>
          )}

          <div
            ref={listRef}
            role="listbox"
            className="overflow-y-auto scrollbar-thin py-1"
            style={{ maxHeight: Math.min(260, pos.maxHeight) }}
          >
            {filtered.length === 0 && !showCreate && (
              <div className="px-3 py-6 text-center text-[13px] text-[var(--color-fg-3)]">
                {emptyText}
              </div>
            )}
            {filtered.map((it, idx) => {
                const isActive = idx === activeIdx;
                const isSelected = it.id === value;
                const prev = idx > 0 ? filtered[idx - 1] : null;
                // séparateur entre dernière option pinned et 1ère non-pinned
                const showSeparator = prev?.pinned && !it.pinned;
                return (
                  <div key={it.id}>
                    {showSeparator && (
                      <div className="my-1 mx-2 border-t border-[var(--color-border)]" />
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        onChange(it.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left transition-colors",
                        isActive
                          ? "bg-[var(--color-surface-2)] text-[var(--color-fg)]"
                          : "text-[var(--color-fg-2)]",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div>{it.label}</div>
                        {it.sublabel && (
                          <div className="text-[12px] text-[var(--color-fg-mute)] truncate">
                            {it.sublabel}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="size-3.5 text-[var(--color-accent)] shrink-0" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                );
              })}
            {showCreate && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onCreate?.(trimmedQuery);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left transition-colors text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] border-t border-[var(--color-border)]"
              >
                <Plus className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">Ajouter «&nbsp;{trimmedQuery}&nbsp;»</span>
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
});
