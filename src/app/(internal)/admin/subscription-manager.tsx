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
import {
  type ManagerPlan,
  PlanTile,
  AddonPicker,
  PlanRecap,
  effectiveAddonsOf,
  fmt,
  quotaLine,
} from "./plan-ui";

export type { ManagerPlan };

type Sub = {
  status: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  graceUntil: string | null;
  addons: string[];
} | null;

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
  plans: ManagerPlan[];
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
  const [graceUntil, setGraceUntil] = useState(subscription?.graceUntil?.slice(0, 10) ?? "");

  // On ne gère en état que les EXTRAS choisis à la main ; les inclus viennent du plan.
  const initialPlan = plans.find((p) => p.id === (subscription?.planId ?? ""));
  const initialIncluded = initialPlan?.includedAddons ?? [];
  const [extraAddons, setExtraAddons] = useState<string[]>(
    (subscription?.addons ?? []).filter((a) => !initialIncluded.includes(a)),
  );
  useEscapeClose(open, () => setOpen(false), !pending);

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;

  function toggleExtra(id: string, on: boolean) {
    setExtraAddons((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function save() {
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId || null,
          status,
          currentPeriodEnd: periodEnd || null,
          graceUntil: graceUntil || null,
          addons: effectiveAddonsOf(selectedPlan, extraAddons),
        }),
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
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-[53rem] max-h-[88vh] flex flex-col"
            >
              {/* En-tête */}
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="text-[14px] font-semibold text-[var(--color-fg)]">Abonnement</div>
                  <div className="text-[12px] text-[var(--color-fg-3)]">{orgName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Corps 2 colonnes — le formulaire (1fr) est large, le récap fixe à 248px */}
              <div className="grid md:grid-cols-[1fr_248px] overflow-hidden flex-1 min-h-0">
                {/* Colonne gauche : contrôles */}
                <div className="overflow-y-auto p-5 space-y-5">
                  {/* Sélecteur de plan en cartes */}
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <div className="grid gap-2" role="radiogroup" aria-label="Plan">
                      <PlanTile
                        selected={planId === ""}
                        onSelect={() => setPlanId("")}
                        title="Aucun plan"
                        subtitle="Pas de facturation ni de quotas"
                      />
                      {plans.map((p) => (
                        <PlanTile
                          key={p.id}
                          selected={planId === p.id}
                          onSelect={() => setPlanId(p.id)}
                          title={p.name}
                          subtitle={quotaLine(p)}
                          price={`${fmt(p.price)} MAD`}
                          priceHint="/ mois HT"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Add-ons — juste sous le plan. Les inclus sont verrouillés (badge « Inclus »). */}
                  <div className="space-y-2">
                    <Label>Modules (add-ons)</Label>
                    <AddonPicker plan={selectedPlan} extraAddons={extraAddons} onToggle={toggleExtra} />
                  </div>

                  {/* Statut + échéance */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Statut</Label>
                      <Combobox items={STATUSES} value={status} onChange={setStatus} searchable={false} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Échéance (expiration)</Label>
                      <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                    </div>
                  </div>

                  {/* Rallonge exceptionnelle */}
                  <div className="space-y-1.5">
                    <Label>Rallonge exceptionnelle (facultatif)</Label>
                    <Input type="date" value={graceUntil} onChange={(e) => setGraceUntil(e.target.value)} />
                    <p className="text-[12px] text-[var(--color-fg-3)]">
                      Si renseignée, l'accès est maintenu jusqu'à cette date <strong>même si l'échéance est
                      dépassée et impayée</strong> — pas de suspension automatique. « Suspendu » / « Résilié »
                      coupent l'accès quoi qu'il arrive.
                    </p>
                  </div>
                </div>

                {/* Colonne droite : récapitulatif live */}
                <aside className="border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-5 overflow-y-auto">
                  <PlanRecap
                    plan={selectedPlan}
                    status={status}
                    periodEnd={periodEnd}
                    graceUntil={graceUntil}
                    extraAddons={extraAddons}
                  />
                </aside>
              </div>

              {/* Pied */}
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border)]">
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
