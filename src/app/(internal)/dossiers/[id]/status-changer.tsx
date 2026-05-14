"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { STATUS_LABELS } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dossier/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
        Changer le statut <ChevronDown className="size-3" strokeWidth={1.5} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-[var(--color-card)] border border-[var(--color-rule-strong)] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.2)] p-5 z-30 animate-fade-up">
          <div className="label-eyebrow mb-2">Statut actuel</div>
          <div className="mb-5">
            <StatusBadge status={currentStatus} size="sm" />
          </div>
          <div className="space-y-2 mb-4">
            <Label htmlFor="target">Nouveau statut</Label>
            <select
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value as DossierStatus)}
              className="h-9 w-full text-[14px] bg-transparent border-0 border-b border-[var(--color-rule-strong)] focus:outline-none focus:border-[var(--color-ink)]"
            >
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 mb-5">
            <Label htmlFor="note">Note (facultatif)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contexte du changement…"
            />
          </div>
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
