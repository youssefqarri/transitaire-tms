"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { STATUS_LABELS } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function StatusChanger({
  dossierId,
  currentStatus,
  allowedStatuses,
}: {
  dossierId: string;
  currentStatus: DossierStatus;
  /** Si fourni, restreint la liste des statuts proposés (ex. comptable). */
  allowedStatuses?: DossierStatus[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const initial =
    allowedStatuses && !allowedStatuses.includes(currentStatus)
      ? allowedStatuses[0]
      : currentStatus;
  const [target, setTarget] = useState<DossierStatus>(initial);

  const options = allowedStatuses
    ? (Object.entries(STATUS_LABELS) as [DossierStatus, string][]).filter(([k]) =>
        allowedStatuses.includes(k),
      )
    : (Object.entries(STATUS_LABELS) as [DossierStatus, string][]);

  function submit() {
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        toast.error("Erreur lors du changement de statut");
        return;
      }
      toast.success("Statut mis à jour");
      setOpen(false);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        Changer le statut <ChevronDown className="size-3.5" strokeWidth={2} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[320px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] p-4 z-30 animate-fade-in">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="target">Nouveau statut</Label>
              {options.length >= 10 ? (
                <Combobox
                  id="target"
                  items={options.map(([k, label]) => ({ id: k, label }))}
                  value={target}
                  onChange={(v) => setTarget(v as DossierStatus)}
                  placeholder="Sélectionner un statut…"
                  searchPlaceholder="Rechercher un statut…"
                />
              ) : (
                <Select
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as DossierStatus)}
                >
                  {options.map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contexte du changement…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={submit} disabled={pending || target === currentStatus}>
                {pending ? "Mise à jour…" : "Confirmer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
