"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    if (!number) { toast.error("Numéro DUM requis"); return; }
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/dums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, bureau }),
      });
      if (!res.ok) { toast.error("Erreur (numéro déjà utilisé ?)"); return; }
      toast.success("DUM créée");
      setNumber("");
      setBureau("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2">
          <FileText className="size-4" /> DUMs
          <span className="text-xs text-[var(--color-muted-foreground)] font-normal">
            ({dums.length})
          </span>
        </div>
        {canCreate && (
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <Plus className="size-4" /> Nouvelle DUM
          </Button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="p-5 border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">Numéro DUM</label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">Bureau douane</label>
            <Input value={bureau} onChange={(e) => setBureau(e.target.value)} />
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
      <div className="divide-y divide-[var(--color-border)]">
        {dums.length === 0 && (
          <div className="p-8 text-sm text-[var(--color-muted-foreground)] text-center">
            Aucune DUM enregistrée. Créez-la après dépôt sur BADR.
          </div>
        )}
        {dums.map((d) => (
          <div key={d.id} className="p-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0">
              <FileText className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{d.number}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">
                {d.bureau ?? "Bureau ?"} · enregistré le {formatDate(d.registeredAt)}
              </div>
            </div>
            <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
