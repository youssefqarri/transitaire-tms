"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  X,
  Check,
  MessageCircle,
  Code2,
  BarChart3,
  Users,
  FolderOpen,
  HardDrive,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";
import { cn } from "@/lib/utils";

export type ManagerPlan = {
  id: string;
  name: string;
  price: number;
  priceYearly: number | null;
  maxSeats: number | null;
  maxDossiersPerMonth: number | null;
  maxStorageGb: number | null;
};

type Sub = {
  status: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  addons: string[];
} | null;

const ADDONS = [
  {
    id: "WHATSAPP",
    label: "Notifications WhatsApp",
    desc: "Relances et alertes clients par WhatsApp",
    icon: MessageCircle,
  },
  { id: "API", label: "Accès API", desc: "Intégrations via l'API REST", icon: Code2 },
  { id: "REPORTING", label: "Reporting avancé", desc: "Rapports détaillés et exports", icon: BarChart3 },
] as const;

const STATUSES = [
  { id: "TRIAL", label: "Essai" },
  { id: "ACTIVE", label: "Actif" },
  { id: "PAST_DUE", label: "Impayé" },
  { id: "SUSPENDED", label: "Suspendu (accès coupé)" },
  { id: "CANCELLED", label: "Résilié (accès coupé)" },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  TRIAL: { label: "Essai", className: "text-[var(--color-info)] bg-[var(--color-info-soft)]" },
  ACTIVE: { label: "Actif", className: "text-[var(--color-success)] bg-[var(--color-success-soft)]" },
  PAST_DUE: { label: "Impayé", className: "text-[var(--color-warning)] bg-[var(--color-warning-soft)]" },
  SUSPENDED: { label: "Suspendu", className: "text-[var(--color-danger)] bg-[var(--color-danger-soft)]" },
  CANCELLED: { label: "Résilié", className: "text-[var(--color-fg-mute)] bg-[var(--color-surface-2)]" },
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

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
  const [addons, setAddons] = useState<string[]>(subscription?.addons ?? []);
  useEscapeClose(open, () => setOpen(false), !pending);

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const yearlyPct =
    selectedPlan?.priceYearly && selectedPlan.price > 0
      ? Math.round((1 - selectedPlan.priceYearly / (selectedPlan.price * 12)) * 100)
      : 0;
  const statusMeta = STATUS_META[status] ?? STATUS_META.TRIAL;

  function toggleAddon(id: string, on: boolean) {
    setAddons((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function save() {
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: planId || null, status, currentPeriodEnd: periodEnd || null, addons }),
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

  // Petit résumé de quotas affiché sous le nom de chaque carte plan.
  const quotaLine = (p: ManagerPlan) =>
    [
      p.maxSeats ? `${p.maxSeats} sièges` : "sièges ∞",
      p.maxDossiersPerMonth ? `${fmt(p.maxDossiersPerMonth)} dossiers/mois` : "dossiers ∞",
      p.maxStorageGb ? `${p.maxStorageGb} Go` : "stockage ∞",
    ].join(" · ");

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
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-3xl max-h-[88vh] flex flex-col"
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

              {/* Corps 2 colonnes */}
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
                  <p className="text-[12px] text-[var(--color-fg-3)] -mt-2">
                    « Suspendu » / « Résilié » coupent l'accès des utilisateurs du cabinet. Une échéance
                    dépassée (hors essai) coupe aussi l'accès.
                  </p>

                  {/* Add-ons */}
                  <div className="space-y-2">
                    <Label>Modules optionnels (add-ons)</Label>
                    <div className="grid gap-2">
                      {ADDONS.map((a) => {
                        const on = addons.includes(a.id);
                        const Icon = a.icon;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            role="switch"
                            aria-checked={on}
                            onClick={() => toggleAddon(a.id, !on)}
                            className={cn(
                              "flex items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors cursor-pointer",
                              on
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06]"
                                : "border-[var(--color-border-2)] hover:border-[var(--color-fg-mute)]",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                on ? "text-[var(--color-accent)]" : "text-[var(--color-fg-3)]",
                              )}
                              strokeWidth={1.75}
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] font-medium text-[var(--color-fg)]">
                                {a.label}
                              </span>
                              <span className="block text-[12px] text-[var(--color-fg-3)]">{a.desc}</span>
                            </span>
                            <span
                              className={cn(
                                "size-4 rounded-[4px] border flex items-center justify-center shrink-0",
                                on
                                  ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                                  : "border-[var(--color-border-2)]",
                              )}
                            >
                              {on && <Check className="size-3 text-white" strokeWidth={3} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Colonne droite : récapitulatif live */}
                <aside className="border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-5 overflow-y-auto">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-fg-mute)]">
                    Récapitulatif
                  </div>

                  <div className="mt-3">
                    <div className="text-[15px] font-semibold text-[var(--color-fg)]">
                      {selectedPlan?.name ?? "Aucun plan"}
                    </div>
                    {selectedPlan ? (
                      <div className="mt-1">
                        <span className="text-[20px] font-semibold tnum text-[var(--color-fg)]">
                          {fmt(selectedPlan.price)}
                        </span>
                        <span className="text-[12px] text-[var(--color-fg-3)]"> MAD / mois HT</span>
                        {selectedPlan.priceYearly ? (
                          <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                            ou <span className="tnum text-[var(--color-fg)]">{fmt(selectedPlan.priceYearly)}</span>{" "}
                            MAD/an HT
                            {yearlyPct > 0 && (
                              <span className="ml-1 text-[var(--color-success)] font-medium">−{yearlyPct}%</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-[12px] text-[var(--color-fg-3)] mt-1">
                        Aucune facturation ni quota appliqué.
                      </div>
                    )}
                  </div>

                  {selectedPlan && (
                    <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
                      <RecapRow icon={Users} label="Sièges" value={selectedPlan.maxSeats ? fmt(selectedPlan.maxSeats) : "Illimité"} />
                      <RecapRow
                        icon={FolderOpen}
                        label="Dossiers / mois"
                        value={selectedPlan.maxDossiersPerMonth ? fmt(selectedPlan.maxDossiersPerMonth) : "Illimité"}
                      />
                      <RecapRow
                        icon={HardDrive}
                        label="Stockage"
                        value={selectedPlan.maxStorageGb ? `${selectedPlan.maxStorageGb} Go` : "Illimité"}
                      />
                    </div>
                  )}

                  <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-[var(--color-fg-3)]">Statut</span>
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full",
                          statusMeta.className,
                        )}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <RecapRow
                      icon={CalendarClock}
                      label="Échéance"
                      value={periodEnd ? new Date(periodEnd).toLocaleDateString("fr-FR") : "—"}
                    />
                  </div>

                  <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                    <div className="text-[12px] text-[var(--color-fg-3)] mb-1.5">Add-ons</div>
                    {addons.length === 0 ? (
                      <div className="text-[12px] text-[var(--color-fg-mute)]">Aucun</div>
                    ) : (
                      <ul className="space-y-1">
                        {ADDONS.filter((a) => addons.includes(a.id)).map((a) => (
                          <li key={a.id} className="flex items-center gap-1.5 text-[12px] text-[var(--color-fg-2)]">
                            <Check className="size-3.5 text-[var(--color-success)] shrink-0" strokeWidth={2.5} />
                            {a.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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

function PlanTile({
  selected,
  onSelect,
  title,
  subtitle,
  price,
  priceHint,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  price?: string;
  priceHint?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors cursor-pointer",
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06]"
          : "border-[var(--color-border-2)] hover:border-[var(--color-fg-mute)]",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full border flex items-center justify-center shrink-0",
          selected ? "border-[var(--color-accent)]" : "border-[var(--color-border-2)]",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-[var(--color-accent)]" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium text-[var(--color-fg)]">{title}</span>
        <span className="block text-[12px] text-[var(--color-fg-3)] truncate">{subtitle}</span>
      </span>
      {price && (
        <span className="text-right shrink-0">
          <span className="block text-[13px] font-semibold tnum text-[var(--color-fg)]">{price}</span>
          {priceHint && <span className="block text-[11px] text-[var(--color-fg-3)]">{priceHint}</span>}
        </span>
      )}
    </button>
  );
}

function RecapRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-fg-3)]">
        <Icon className="size-3.5 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
        {label}
      </span>
      <span className="text-[12px] font-medium tnum text-[var(--color-fg)]">{value}</span>
    </div>
  );
}
