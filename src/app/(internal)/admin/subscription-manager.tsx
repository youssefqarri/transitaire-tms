"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

type Plan = { id: string; name: string };
type Sub = { status: string; planId: string | null; currentPeriodEnd: string | null } | null;

const STATUSES = [
  { id: "TRIAL", label: "Essai" },
  { id: "ACTIVE", label: "Actif" },
  { id: "PAST_DUE", label: "Impayé" },
  { id: "SUSPENDED", label: "Suspendu (accès coupé)" },
  { id: "CANCELLED", label: "Résilié (accès coupé)" },
];

export function SubscriptionManager({
  orgId,
  orgName,
  plans,
  subscription,
}: {
  orgId: string;
  orgName: string;
  plans: Plan[];
  subscription: Sub;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  // Essai : par défaut on prérempli l'échéance à +1 mois quand rien n'est encore fixé.
  const defaultEnd = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  };
  const [planId, setPlanId] = useState(subscription?.planId ?? "");
  const [status, setStatus] = useState(subscription?.status ?? "TRIAL");
  const [periodEnd, setPeriodEnd] = useState(subscription?.currentPeriodEnd?.slice(0, 10) ?? defaultEnd());
  useEscapeClose(open, () => setOpen(false), !pending);

  function save() {
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: planId || null, status, currentPeriodEnd: periodEnd || null }),
      });
      if (!res.ok) {
        toast.error("Échec de la mise à jour");
        return;
      }
      toast.success("Abonnement mis à jour");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="soft" size="sm" onClick={() => setOpen(true)}>
        <CreditCard /> Abonnement
      </Button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6 animate-fade-in"
            onMouseDown={backdropDismiss(() => !pending && setOpen(false))}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-[14px] font-semibold">Abonnement — {orgName}</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Combobox
                  items={[{ id: "", label: "— Aucun —" }, ...plans.map((p) => ({ id: p.id, label: p.name }))]}
                  value={planId}
                  onChange={setPlanId}
                  searchable={plans.length > 10}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Combobox items={STATUSES} value={status} onChange={setStatus} searchable={false} />
              </div>

              <div className="space-y-1.5">
                <Label>Échéance (expiration)</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>

              <p className="text-[12px] text-[var(--color-fg-3)]">
                « Suspendu » / « Résilié » coupent l'accès des utilisateurs du cabinet. Une échéance
                dépassée (hors essai) coupe aussi l'accès.
              </p>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={save} disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
