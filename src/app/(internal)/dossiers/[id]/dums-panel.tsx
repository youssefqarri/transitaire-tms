"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import { DUM_REGIMES, MAX_DUMS_PER_DOSSIER } from "@/lib/reference";
import type { DUMStatus } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/utils";

type DUM = {
  id: string;
  number: string;
  status: DUMStatus;
  bureau: string | null;
  regime: string | null;
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
  const [regime, setRegime] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");

  const atMax = dums.length >= MAX_DUMS_PER_DOSSIER;

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
        body: JSON.stringify({ number, bureau, regime, registeredAt: registeredAt || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erreur (numéro déjà utilisé ?)");
        return;
      }
      toast.success("DUM créée");
      setNumber("");
      setBureau("");
      setRegime("");
      setRegisteredAt("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          DUMs
          <span className="ml-2 text-[11.5px] font-normal text-[var(--color-fg-3)] tnum">
            {dums.length}
          </span>
        </CardTitle>
        {canCreate && !atMax && (
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <Plus /> Nouvelle DUM
          </Button>
        )}
      </CardHeader>

      {open && (
        <form onSubmit={submit} className="px-5 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="dumnum">Numéro DUM</Label>
            <Input id="dumnum" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumregime">Régime douanier</Label>
            <Select id="dumregime" value={regime} onChange={(e) => setRegime(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {DUM_REGIMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bureau">Bureau douane</Label>
            <Input id="bureau" value={bureau} onChange={(e) => setBureau(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumdate">Date d'enregistrement</Label>
            <Input
              id="dumdate"
              type="date"
              value={registeredAt}
              onChange={(e) => setRegisteredAt(e.target.value)}
            />
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
          <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucune DUM enregistrée. Elle sera créée après dépôt sur BADR.
          </div>
        )}
        {dums.map((d) => (
          <div key={d.id} className="px-5 py-3 flex items-center gap-3">
            <FileText className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-medium text-[var(--color-fg)]">{d.number}</span>
                {d.regime && <Badge tone="neutral">{d.regime}</Badge>}
              </div>
              <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                {d.bureau ?? "Bureau ?"} · enregistré le {formatDate(d.registeredAt)}
              </div>
            </div>
            <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
          </div>
        ))}
        {canCreate && atMax && (
          <div className="px-5 py-2.5 text-[11.5px] text-[var(--color-fg-3)] bg-[var(--color-surface-2)]">
            Maximum {MAX_DUMS_PER_DOSSIER} DUM par dossier atteint (un dossier peut cumuler 2 régimes).
          </div>
        )}
      </div>
    </Card>
  );
}
