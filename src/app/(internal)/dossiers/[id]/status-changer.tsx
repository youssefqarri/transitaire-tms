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
import { cn } from "@/lib/utils";

export function StatusChanger({
  dossierId,
  currentStatus,
  currentSecondaryStatus,
  allowedStatuses,
}: {
  dossierId: string;
  currentStatus: DossierStatus;
  /** 2ᵉ statut « organismes de contrôle » courant (en parallèle de la douane). */
  currentSecondaryStatus?: DossierStatus | null;
  /** Si fourni, restreint la liste des statuts proposés (ex. comptable). */
  allowedStatuses?: DossierStatus[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [track, setTrack] = useState<"DOUANE" | "CONTROLE">("DOUANE");

  // « Annulé » retiré du menu : l'annulation passe par une action dédiée confirmée
  // (évite d'annuler un dossier par mégarde en cherchant juste à changer d'étape).
  const options = (
    allowedStatuses
      ? (Object.entries(STATUS_LABELS) as [DossierStatus, string][]).filter(([k]) =>
          allowedStatuses.includes(k),
        )
      : (Object.entries(STATUS_LABELS) as [DossierStatus, string][])
  ).filter(([k]) => k !== "ANNULE");

  // Voie « organismes de contrôle » : réservée aux rôles qui gèrent le dossier
  // (pas la comptabilité, dont la liste restreinte ne contient pas ANNULE).
  const canControl = !allowedStatuses || allowedStatuses.includes("ANNULE");

  const initial =
    allowedStatuses && !allowedStatuses.includes(currentStatus)
      ? allowedStatuses[0]
      : currentStatus;
  const [target, setTarget] = useState<DossierStatus>(initial);

  const activeCurrent: DossierStatus | null =
    track === "DOUANE" ? currentStatus : currentSecondaryStatus ?? null;

  function switchTrack(t: "DOUANE" | "CONTROLE") {
    setTrack(t);
    const cur = t === "DOUANE" ? currentStatus : currentSecondaryStatus ?? null;
    setTarget(cur && options.some(([k]) => k === cur) ? cur : options[0]?.[0] ?? currentStatus);
  }

  function submit() {
    // Statut inchangé + note = on ajoute simplement une note libre à la chronologie.
    const noteOnly = target === activeCurrent;
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target, note: note.trim() || undefined, track }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'enregistrement");
        return;
      }
      toast.success(noteOnly ? "Note ajoutée à la chronologie" : "Statut mis à jour");
      setOpen(false);
      setNote("");
      router.refresh();
    });
  }

  // Annulation du dossier : action dédiée et confirmée (ANNULE n'est plus dans le menu).
  function cancelDossier() {
    if (!confirm("Annuler ce dossier ? Il passera au statut « Annulé ».")) return;
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ANNULE", note: note.trim() || undefined }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'annulation");
        return;
      }
      toast.success("Dossier annulé");
      setOpen(false);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        Changer le statut <ChevronDown className="size-3.5" strokeWidth={1.75} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[320px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] p-4 z-30 animate-fade-in">
          <div className="space-y-3">
            {canControl && (
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-[var(--color-surface-2)] rounded-[var(--radius)]">
                {(["DOUANE", "CONTROLE"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTrack(t)}
                    className={cn(
                      "text-[12px] py-1.5 rounded-[var(--radius-sm)] transition-colors",
                      track === t
                        ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm font-medium"
                        : "text-[var(--color-fg-3)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    {t === "DOUANE" ? "Douane" : "Organismes"}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="target">
                {track === "CONTROLE" ? "Statut organismes de contrôle" : "Nouveau statut"}
              </Label>
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
              {track === "CONTROLE" && (
                <p className="text-[11px] text-[var(--color-fg-mute)]">
                  En parallèle de la douane — n&apos;écrase pas le statut douane.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note libre / autre (optionnel)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Texte libre — apparaît dans la chronologie…"
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {track === "DOUANE" && currentStatus !== "ANNULE" && canControl ? (
                <button
                  type="button"
                  onClick={cancelDossier}
                  disabled={pending}
                  className="text-[12px] text-[var(--color-danger)] hover:underline disabled:opacity-50"
                >
                  Annuler le dossier
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={pending || (target === activeCurrent && !note.trim())}
                >
                  {pending
                    ? "Enregistrement…"
                    : target === activeCurrent
                      ? "Ajouter la note"
                      : "Confirmer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
