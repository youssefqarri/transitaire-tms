"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import type { DUMStatus } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/utils";

type DUM = {
  id: string;
  number: string;
  status: DUMStatus;
  bureau: string | null;
  registeredAt: Date | null;
};

export function DUMsPanel({
  dossierId,
  dums,
  canCreate,
}: {
  dossierId: string;
  dums: DUM[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [number, setNumber] = useState("");
  const [bureau, setBureau] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!number) {
      toast.error("Numéro DUM requis");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/dums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, bureau }),
      });
      if (!res.ok) {
        toast.error("Erreur (numéro déjà utilisé ?)");
        return;
      }
      toast.success("DUM créée");
      setNumber("");
      setBureau("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2
          className="font-display text-[28px] tracking-[-0.018em]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
        >
          Déclarations
          <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] tabular">
            · {dums.length}
          </span>
        </h2>
        {canCreate && (
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <Plus className="size-3" /> Nouvelle DUM
          </Button>
        )}
      </header>

      {open && (
        <form
          onSubmit={submit}
          className="mb-4 border border-[var(--color-rule-strong)] bg-[var(--color-paper-strong)] p-5 grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up"
        >
          <div className="space-y-2">
            <Label htmlFor="dumnum">Numéro DUM</Label>
            <Input id="dumnum" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bureau">Bureau douane</Label>
            <Input id="bureau" value={bureau} onChange={(e) => setBureau(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      )}

      <div className="border-t border-b border-[var(--color-rule-strong)]">
        {dums.length === 0 && (
          <div className="py-10 text-center text-[14px] text-[var(--color-ink-mute)] font-display italic">
            Aucune DUM enregistrée. Elle sera créée après dépôt sur BADR.
          </div>
        )}
        {dums.map((d, idx) => (
          <div
            key={d.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 px-1 border-b border-[var(--color-rule)] last:border-b-0"
          >
            <span className="font-mono text-[10px] text-[var(--color-ink-mute)] tabular w-6">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-mono text-[15px] tabular text-[var(--color-ink)]">{d.number}</div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] mt-0.5">
                {d.bureau ?? "—"} · enregistré le {formatDate(d.registeredAt)}
              </div>
            </div>
            <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
