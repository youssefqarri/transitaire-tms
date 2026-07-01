"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

// Recherche cabinets (nom / slug) — met à jour ?q= côté serveur, avec debounce.
export function OrgSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronise si la navigation change la query en dehors du champ.
  useEffect(() => setValue(initial), [initial]);

  function push(v: string) {
    const q = v.trim();
    router.replace(q ? `/admin?q=${encodeURIComponent(q)}` : "/admin", { scroll: false });
  }

  function onChange(v: string) {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(v), 250);
  }

  return (
    <div className="relative max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un cabinet…"
        className="w-full h-8 pl-8 pr-8 text-[13px] rounded-[var(--radius-sm)] border border-transparent bg-[var(--color-surface-2)] focus:border-[var(--color-border-2)] focus:bg-[var(--color-surface)] outline-none transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            push("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-mute)] hover:text-[var(--color-fg)]"
          aria-label="Effacer"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
