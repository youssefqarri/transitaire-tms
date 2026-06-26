"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X, ExternalLink, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RestoreButton } from "./restore-button";

export type TrashRow = {
  id: string;
  type: string;
  typeLabel: string;
  label: string;
  sub: string;
  viewHref: string | null;
};

const TYPE_TONE: Record<string, "info" | "accent" | "ok" | "warn" | "neutral"> = {
  dossier: "info",
  client: "accent",
  document: "ok",
  contact: "warn",
};

export function CorbeilleClient({
  rows,
  typeOptions,
}: {
  rows: TrashRow[];
  typeOptions: { value: string; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  const needle = q.trim().toLowerCase();
  const filtered = rows.filter(
    (r) => (!type || r.type === type) && (!needle || r.label.toLowerCase().includes(needle)),
  );

  const field =
    "h-9 bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius-input)] " +
    "hover:border-[var(--color-fg-mute)] focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-[var(--color-accent-ring)] transition-colors";

  return (
    <Card>
      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)] pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher dans la corbeille…"
            aria-label="Rechercher dans la corbeille"
            className={`w-full pl-8 pr-8 text-[13px] placeholder:text-[var(--color-fg-mute)] ${field}`}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Effacer"
              className="absolute right-2 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded text-[var(--color-fg-mute)] hover:text-[var(--color-fg)]"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filtrer par type"
          className={`min-w-[150px] ${type ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]"}`}
        >
          <option value="">Tous les types</option>
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Trash2} title="Aucun élément" hint="Aucun élément ne correspond à votre recherche." />
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {filtered.map((r) => (
            <div key={`${r.type}-${r.id}`} className="px-5 py-3 flex items-center gap-3">
              <Badge tone={TYPE_TONE[r.type] ?? "neutral"} className="w-[80px] justify-center shrink-0">
                {r.typeLabel}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{r.label}</div>
                <div className="text-[12px] text-[var(--color-fg-3)]">Supprimé le {r.sub}</div>
              </div>
              {r.viewHref && (
                <Link
                  href={r.viewHref}
                  className="inline-flex items-center gap-1 text-[12px] text-[var(--color-accent)] hover:underline underline-offset-2 shrink-0"
                >
                  <ExternalLink className="size-3.5" strokeWidth={2} /> Consulter
                </Link>
              )}
              <RestoreButton type={r.type} id={r.id} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
