"use client";

// Briques UI partagées entre la popup Abonnement et le formulaire de création de
// cabinet : cartes de plan (radio), sélecteur d'add-ons (les inclus verrouillés),
// et panneau récapitulatif live. Source unique pour éviter toute dérive visuelle.

import {
  Check,
  Code2,
  BarChart3,
  Users,
  FolderOpen,
  HardDrive,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { cn } from "@/lib/utils";

export type ManagerPlan = {
  id: string;
  name: string;
  price: number;
  priceYearly: number | null;
  maxSeats: number | null;
  maxDossiersPerMonth: number | null;
  maxStorageGb: number | null;
  includedAddons: string[];
};

export const ADDONS = [
  {
    id: "WHATSAPP",
    label: "Notifications WhatsApp",
    desc: "Relances et alertes clients par WhatsApp",
    icon: WhatsAppIcon,
  },
  { id: "API", label: "Accès API", desc: "Intégrations via l'API REST", icon: Code2 },
  { id: "REPORTING", label: "Reporting avancé", desc: "Rapports détaillés et exports", icon: BarChart3 },
] as const;

export const STATUS_META: Record<string, { label: string; className: string }> = {
  TRIAL: { label: "Essai", className: "text-[var(--color-info)] bg-[var(--color-info-soft)]" },
  ACTIVE: { label: "Actif", className: "text-[var(--color-success)] bg-[var(--color-success-soft)]" },
  PAST_DUE: { label: "Impayé", className: "text-[var(--color-warning)] bg-[var(--color-warning-soft)]" },
  SUSPENDED: { label: "Suspendu", className: "text-[var(--color-danger)] bg-[var(--color-danger-soft)]" },
  CANCELLED: { label: "Résilié", className: "text-[var(--color-fg-mute)] bg-[var(--color-surface-2)]" },
};

export const fmt = (n: number) => n.toLocaleString("fr-FR");

export const quotaLine = (p: ManagerPlan) =>
  [
    p.maxSeats ? `${p.maxSeats} sièges` : "sièges ∞",
    p.maxDossiersPerMonth ? `${fmt(p.maxDossiersPerMonth)} dossiers/mois` : "dossiers ∞",
    p.maxStorageGb ? `${p.maxStorageGb} Go` : "stockage ∞",
  ].join(" · ");

/** Effective = add-ons inclus dans le forfait ∪ extras choisis à la main. */
export function effectiveAddonsOf(plan: ManagerPlan | null, extra: string[]): string[] {
  return [...new Set([...(plan?.includedAddons ?? []), ...extra])];
}

// ─── Carte de plan (radio) ───────────────────────────────────────────────────
export function PlanTile({
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

// ─── Sélecteur d'add-ons (inclus = verrouillés + badge « Inclus ») ────────────
export function AddonPicker({
  plan,
  extraAddons,
  onToggle,
}: {
  plan: ManagerPlan | null;
  extraAddons: string[];
  onToggle: (id: string, on: boolean) => void;
}) {
  const included = plan?.includedAddons ?? [];
  return (
    <div className="grid gap-2">
      {ADDONS.map((a) => {
        const isIncluded = included.includes(a.id);
        const on = isIncluded || extraAddons.includes(a.id);
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            type="button"
            role="switch"
            aria-checked={on}
            disabled={isIncluded}
            onClick={() => !isIncluded && onToggle(a.id, !on)}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
              isIncluded
                ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04] cursor-default"
                : on
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06] cursor-pointer"
                  : "border-[var(--color-border-2)] hover:border-[var(--color-fg-mute)] cursor-pointer",
            )}
          >
            <Icon
              className={cn("size-4 shrink-0", on ? "text-[var(--color-accent)]" : "text-[var(--color-fg-3)]")}
              strokeWidth={1.75}
            />
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-medium text-[var(--color-fg)]">{a.label}</span>
              <span className="block text-[12px] text-[var(--color-fg-3)]">{a.desc}</span>
            </span>
            {isIncluded ? (
              <span className="text-[11px] font-medium text-[var(--color-accent)] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/[0.08] shrink-0">
                Inclus
              </span>
            ) : (
              <span
                className={cn(
                  "size-4 rounded-[4px] border flex items-center justify-center shrink-0",
                  on ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-border-2)]",
                )}
              >
                {on && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Récapitulatif live ───────────────────────────────────────────────────────
export function PlanRecap({
  plan,
  status,
  periodEnd,
  graceUntil,
  extraAddons,
}: {
  plan: ManagerPlan | null;
  status: string;
  periodEnd: string;
  graceUntil?: string;
  extraAddons: string[];
}) {
  const included = plan?.includedAddons ?? [];
  const effective = effectiveAddonsOf(plan, extraAddons);
  const yearlyPct =
    plan?.priceYearly && plan.price > 0 ? Math.round((1 - plan.priceYearly / (plan.price * 12)) * 100) : 0;
  const statusMeta = STATUS_META[status] ?? STATUS_META.TRIAL;

  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-fg-mute)]">
        Récapitulatif
      </div>

      <div className="mt-3">
        <div className="text-[15px] font-semibold text-[var(--color-fg)]">{plan?.name ?? "Aucun plan"}</div>
        {plan ? (
          <div className="mt-1">
            <span className="text-[20px] font-semibold tnum text-[var(--color-fg)]">{fmt(plan.price)}</span>
            <span className="text-[12px] text-[var(--color-fg-3)]"> MAD / mois HT</span>
            {plan.priceYearly ? (
              <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                ou <span className="tnum text-[var(--color-fg)]">{fmt(plan.priceYearly)}</span> MAD/an HT
                {yearlyPct > 0 && (
                  <span className="ml-1 text-[var(--color-success)] font-medium">−{yearlyPct}%</span>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-[12px] text-[var(--color-fg-3)] mt-1">Aucune facturation ni quota appliqué.</div>
        )}
      </div>

      {plan && (
        <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
          <RecapRow icon={Users} label="Sièges" value={plan.maxSeats ? fmt(plan.maxSeats) : "Illimité"} />
          <RecapRow
            icon={FolderOpen}
            label="Dossiers / mois"
            value={plan.maxDossiersPerMonth ? fmt(plan.maxDossiersPerMonth) : "Illimité"}
          />
          <RecapRow
            icon={HardDrive}
            label="Stockage"
            value={plan.maxStorageGb ? `${plan.maxStorageGb} Go` : "Illimité"}
          />
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-[var(--color-fg-3)]">Statut</span>
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", statusMeta.className)}>
            {statusMeta.label}
          </span>
        </div>
        <RecapRow
          icon={CalendarClock}
          label="Échéance"
          value={periodEnd ? new Date(periodEnd).toLocaleDateString("fr-FR") : "—"}
        />
        {graceUntil && (
          <RecapRow
            icon={CalendarPlus}
            label="Rallonge"
            value={new Date(graceUntil).toLocaleDateString("fr-FR")}
          />
        )}
      </div>

      <div className="mt-4 border-t border-[var(--color-border)] pt-3">
        <div className="text-[12px] text-[var(--color-fg-3)] mb-1.5">Add-ons</div>
        {effective.length === 0 ? (
          <div className="text-[12px] text-[var(--color-fg-mute)]">Aucun</div>
        ) : (
          <ul className="space-y-1">
            {ADDONS.filter((a) => effective.includes(a.id)).map((a) => (
              <li key={a.id} className="flex items-center gap-1.5 text-[12px] text-[var(--color-fg-2)]">
                <Check className="size-3.5 text-[var(--color-success)] shrink-0" strokeWidth={2.5} />
                {a.label}
                {included.includes(a.id) && (
                  <span className="text-[11px] text-[var(--color-fg-mute)]">(inclus)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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
