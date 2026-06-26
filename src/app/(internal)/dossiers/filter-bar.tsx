"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  STATUS_LABELS,
  ACTION_REQUIRED_KEY,
  ACTION_REQUIRED_LABEL,
} from "@/lib/statuses";

export function DossiersFilterBar({
  initialQ,
  initialStatus,
}: {
  initialQ?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(initialQ ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");

  function apply(next: { q?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const newQ = next.q ?? q;
    const newStatus = next.status ?? status;
    if (newQ) params.set("q", newQ);
    else params.delete("q");
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");
    const qs = params.toString();
    start(() => router.push(qs ? `/dossiers?${qs}` : "/dossiers"));
  }

  function reset() {
    setQ("");
    setStatus("");
    start(() => router.push("/dossiers"));
  }

  const hasFilter = !!q || !!status;

  return (
    <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 border-b border-[var(--color-border)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
        className="relative flex-1 min-w-[240px]"
      >
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)] pointer-events-none"
          strokeWidth={1.75}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="N° dossier, DUM, client, référence…"
          aria-label="Rechercher un dossier"
          className="w-full h-9 pl-8 pr-9 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius-input)] placeholder:text-[var(--color-fg-mute)] hover:border-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent transition-shadow"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              apply({ q: "" });
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
            aria-label="Effacer la recherche"
            title="Effacer la recherche"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        )}
      </form>
      <div className="min-w-[220px]">
        <Combobox
          items={[
            { id: "", label: "Tous les statuts", pinned: true },
            { id: ACTION_REQUIRED_KEY, label: ACTION_REQUIRED_LABEL, pinned: true },
            ...Object.entries(STATUS_LABELS).map(([k, label]) => ({
              id: k,
              label,
            })),
          ]}
          value={status}
          onChange={(v) => {
            setStatus(v);
            apply({ status: v });
          }}
          placeholder="Tous les statuts"
          searchPlaceholder="Rechercher un statut…"
        />
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => apply({})}
        loading={pending}
      >
        Filtrer
      </Button>
      {hasFilter && (
        <Button variant="outline" size="sm" onClick={reset} disabled={pending}>
          <X /> Réinitialiser
        </Button>
      )}
    </div>
  );
}
