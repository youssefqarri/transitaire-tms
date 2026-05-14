"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
} from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxItem = {
  id: string;
  label: string;
  sublabel?: string;
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
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => items.find((it) => it.id === value), [items, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.sublabel ? it.sublabel.toLowerCase().includes(q) : false),
    );
  }, [items, query]);

  // close on click outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // focus search when opening, reset state when closing
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      setActiveIdx(0);
      return () => clearTimeout(t);
    } else {
      setQuery("");
    }
  }, [open]);

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
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [filtered, activeIdx, onChange],
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
          "group flex h-9 w-full items-center gap-2 pl-3 pr-2 text-[13px] text-left",
          "bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)]",
          "transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          open && "ring-2 ring-[var(--color-accent-ring)] border-transparent",
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
                  · {selected.sublabel}
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
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="inline-flex items-center justify-center size-5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-2)] text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] cursor-pointer"
          >
            <X className="size-3" strokeWidth={2} />
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-[var(--color-fg-mute)] shrink-0 transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in">
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-[var(--color-fg-mute)] tnum">
              {filtered.length}/{items.length}
            </span>
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="max-h-[260px] overflow-y-auto scrollbar-thin py-1"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12.5px] text-[var(--color-fg-3)]">
                {emptyText}
              </div>
            ) : (
              filtered.map((it, idx) => {
                const isActive = idx === activeIdx;
                const isSelected = it.id === value;
                return (
                  <button
                    key={it.id}
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
                      <div className="truncate">{it.label}</div>
                      {it.sublabel && (
                        <div className="text-[11.5px] text-[var(--color-fg-mute)] truncate">
                          {it.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 text-[var(--color-accent)] shrink-0" strokeWidth={2} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});
