"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { STATUS_LABELS } from "@/lib/statuses";

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

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
        className="relative flex-1 min-w-[260px]"
      >
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]"
          strokeWidth={1.75}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="N° dossier, DUM, client, référence…"
          className="w-full h-9 pl-8 pr-3 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent"
        />
      </form>
      <div className="min-w-[220px]">
        <Select
          value={status}
          onChange={(e) => {
            const v = e.target.value;
            setStatus(v);
            // application immédiate au changement
            apply({ status: v });
          }}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="secondary" size="sm" onClick={() => apply({})} disabled={pending}>
        {pending ? "…" : "Filtrer"}
      </Button>
      {(q || status) && (
        <Button variant="ghost" size="sm" onClick={reset} disabled={pending}>
          <X /> Réinitialiser
        </Button>
      )}
    </div>
  );
}
