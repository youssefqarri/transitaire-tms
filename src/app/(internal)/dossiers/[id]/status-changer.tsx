"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { STATUS_LABELS } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dossier/status-badge";

export function StatusChanger({
  dossierId,
  currentStatus,
}: {
  dossierId: string;
  currentStatus: DossierStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [target, setTarget] = useState<DossierStatus>(currentStatus);

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
        Changer le statut <ChevronDown className="size-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-xl z-20 p-4 animate-fade-in">
          <div className="text-xs text-[var(--color-muted-foreground)] mb-1">Statut actuel</div>
          <div className="mb-3">
            <StatusBadge status={currentStatus} />
          </div>
          <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">
            Nouveau statut
          </label>
          <select
            className="w-full h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] mb-3"
            value={target}
            onChange={(e) => setTarget(e.target.value as DossierStatus)}
          >
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">
            Note (optionnel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contexte du changement…"
            className="w-full min-h-[60px] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] mb-3 resize-y"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={submit} disabled={pending || target === currentStatus}>
              {pending ? "Mise à jour…" : "Confirmer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
