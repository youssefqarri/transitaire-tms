"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  type ManagerPlan,
  PlanTile,
  AddonPicker,
  PlanRecap,
  effectiveAddonsOf,
  fmt,
  quotaLine,
} from "../plan-ui";

const EMPTY = {
  name: "",
  slug: "",
  ice: "",
  rc: "",
  taxId: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

const STATUSES = [
  { id: "TRIAL", label: "Essai" },
  { id: "ACTIVE", label: "Actif" },
  { id: "PAST_DUE", label: "Impayé" },
];

export function NewOrgForm({ plans }: { plans: ManagerPlan[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Abonnement à la création.
  const defaultEnd = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  };
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState("TRIAL");
  const [periodEnd, setPeriodEnd] = useState(defaultEnd());
  const [extraAddons, setExtraAddons] = useState<string[]>([]);
  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const toggleExtra = (id: string, on: boolean) =>
    setExtraAddons((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/admin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          planId: planId || null,
          status,
          currentPeriodEnd: periodEnd || null,
          addons: effectiveAddonsOf(selectedPlan, extraAddons),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec de la création");
        return;
      }
      toast.success("Cabinet créé");
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_260px] gap-6 items-start">
      {/* Colonne gauche : formulaire */}
      <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="space-y-3">
          <div className="text-[13px] font-semibold text-[var(--color-fg)]">Cabinet</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom *">
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Slug *">
              <Input
                value={f.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase())}
                placeholder="cabinet-untel"
                required
              />
            </Field>
            <Field label="ICE">
              <Input value={f.ice} onChange={(e) => set("ice", e.target.value)} />
            </Field>
            <Field label="RC">
              <Input value={f.rc} onChange={(e) => set("rc", e.target.value)} />
            </Field>
            <Field label="Identifiant fiscal">
              <Input value={f.taxId} onChange={(e) => set("taxId", e.target.value)} />
            </Field>
            <Field label="Ville">
              <Input value={f.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Adresse">
              <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email du cabinet">
              <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <div className="text-[13px] font-semibold text-[var(--color-fg)]">Premier administrateur</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom *">
              <Input value={f.adminName} onChange={(e) => set("adminName", e.target.value)} required />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={f.adminEmail}
                onChange={(e) => set("adminEmail", e.target.value)}
                required
              />
            </Field>
            <Field label="Mot de passe * (8 caractères min.)">
              <Input
                type="password"
                value={f.adminPassword}
                onChange={(e) => set("adminPassword", e.target.value)}
                required
                minLength={8}
              />
            </Field>
          </div>
        </div>

        {/* Abonnement */}
        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <div className="text-[13px] font-semibold text-[var(--color-fg)]">Abonnement</div>
          <div className="space-y-2">
            <Label>Forfait</Label>
            <div className="grid gap-2" role="radiogroup" aria-label="Forfait">
              <PlanTile
                selected={planId === ""}
                onSelect={() => setPlanId("")}
                title="Aucun forfait"
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

          <div className="space-y-2">
            <Label>Modules (add-ons)</Label>
            <AddonPicker plan={selectedPlan} extraAddons={extraAddons} onToggle={toggleExtra} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Statut">
              <Combobox items={STATUSES} value={status} onChange={setStatus} searchable={false} />
            </Field>
            <Field label="Échéance (expiration)">
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button disabled={pending}>{pending ? "Création…" : "Créer le cabinet"}</Button>
        </div>
      </div>

      {/* Colonne droite : récapitulatif du forfait */}
      <aside className="lg:sticky lg:top-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-5">
        <PlanRecap plan={selectedPlan} status={status} periodEnd={periodEnd} extraAddons={extraAddons} />
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
