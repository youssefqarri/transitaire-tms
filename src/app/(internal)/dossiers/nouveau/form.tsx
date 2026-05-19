"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";

type Client = { id: string; name: string; code?: string | null; city?: string | null };
type Supplier = { id: string; name: string; country?: string | null };

type PackagingUnit = "COLIS" | "PALETTES" | "CONTENEURS";

const PACKAGING_LABELS: Record<PackagingUnit, string> = {
  COLIS: "Colis",
  PALETTES: "Palettes",
  CONTENEURS: "Conteneurs",
};

type FormState = {
  number: string;
  reference: string;
  type: "IMPORT" | "EXPORT";
  paymentMode: "WITH_PAYMENT" | "WITHOUT_PAYMENT";
  clientId: string;
  supplierId: string;
  goodsValue: string;
  goodsCurrency: string;
  goodsWeight: string;
  goodsPackages: string;
  goodsPackagingUnit: PackagingUnit;
  goodsDescription: string;
  controlOffice?: string;
  visitDate?: string;
  conformityVisitDate?: string;
  // drapeaux parallèles (édition uniquement)
  billed?: boolean;
  delivered?: boolean;
  baeUnderPayment?: boolean;
  baeUnderConformity?: boolean;
  awaitingConformityValidation?: boolean;
  customNote?: string;
};

export function NewDossierForm({
  clients,
  suppliers,
  mode = "create",
  dossierId,
  initial,
}: {
  clients: Client[];
  suppliers: Supplier[];
  mode?: "create" | "edit";
  dossierId?: string;
  initial?: Partial<FormState>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState>({
    number: "",
    reference: "",
    type: "IMPORT",
    paymentMode: "WITH_PAYMENT",
    clientId: clients[0]?.id ?? "",
    supplierId: "",
    goodsValue: "",
    goodsCurrency: "EUR",
    goodsWeight: "",
    goodsPackages: "",
    goodsPackagingUnit: "COLIS",
    goodsDescription: "",
    controlOffice: "",
    visitDate: "",
    conformityVisitDate: "",
    billed: false,
    delivered: false,
    baeUnderPayment: false,
    baeUnderConformity: false,
    awaitingConformityValidation: false,
    customNote: "",
    ...initial,
  });

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) {
      toast.error("Client requis");
      return;
    }

    start(async () => {
      const url = mode === "edit" ? `/api/dossiers/${dossierId}` : "/api/dossiers";
      const method = mode === "edit" ? "PATCH" : "POST";
      // PATCH attend les nombres en number, POST en string. On formate.
      const body =
        mode === "edit"
          ? {
              number: form.number?.trim() || undefined,
              reference: form.reference || null,
              clientId: form.clientId,
              supplierId: form.supplierId || null,
              goodsValue: form.goodsValue ? Number(form.goodsValue) : null,
              goodsCurrency: form.goodsCurrency,
              goodsWeight: form.goodsWeight ? Number(form.goodsWeight) : null,
              goodsPackages: form.goodsPackages ? Number(form.goodsPackages) : null,
              goodsPackagingUnit: form.goodsPackagingUnit,
              goodsDescription: form.goodsDescription || null,
              controlOffice: form.controlOffice || null,
              visitDate: form.visitDate || null,
              conformityVisitDate: form.conformityVisitDate || null,
              hasVisit: !!form.visitDate,
              hasConformityVisit: !!form.conformityVisitDate,
              billed: !!form.billed,
              delivered: !!form.delivered,
              baeUnderPayment: !!form.baeUnderPayment,
              baeUnderConformity: !!form.baeUnderConformity,
              awaitingConformityValidation: !!form.awaitingConformityValidation,
              customNote: form.customNote || null,
            }
          : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(mode === "edit" ? "Dossier mis à jour" : "Dossier créé");
      router.push(mode === "edit" ? `/dossiers/${dossierId}` : `/dossiers/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Numéro de dossier (WinApp)</Label>
          <Input
            id="number"
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder={mode === "create" ? "Laisser vide pour un numéro provisoire" : "Ex. D-2026-00123"}
          />
          <p className="text-[11px] text-[var(--color-fg-mute)]">
            {mode === "create"
              ? "Optionnel : un numéro PROV-AAAA-NNNN sera attribué si vide, à remplacer par le numéro WinApp réel quand disponible."
              : "Modifiable — pour remplacer un numéro provisoire par le vrai numéro WinApp."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference">Référence fournisseur</Label>
          <Input
            id="reference"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="Objet du mail / réf. expéditeur (optionnel)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            value={form.type}
            onChange={(e) => set("type", e.target.value as "IMPORT" | "EXPORT")}
            disabled={mode === "edit"}
          >
            <option value="IMPORT">Import</option>
            <option value="EXPORT">Export</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMode">Mode de paiement</Label>
          <Select
            id="paymentMode"
            value={form.paymentMode}
            onChange={(e) =>
              set("paymentMode", e.target.value as "WITH_PAYMENT" | "WITHOUT_PAYMENT")
            }
            disabled={mode === "edit"}
          >
            <option value="WITH_PAYMENT">Avec paiement (engagement requis)</option>
            <option value="WITHOUT_PAYMENT">Sans paiement</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">Client *</Label>
          <Combobox
            id="clientId"
            items={clients.map((c) => ({
              id: c.id,
              label: c.name,
              sublabel: [c.code, c.city].filter(Boolean).join(" · ") || undefined,
            }))}
            value={form.clientId}
            onChange={(id) => set("clientId", id)}
            placeholder="Sélectionner un client…"
            searchPlaceholder="Rechercher par nom, code, ville…"
            emptyText="Aucun client trouvé"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplierId">Fournisseur</Label>
          <Combobox
            id="supplierId"
            items={suppliers.map((s) => ({
              id: s.id,
              label: s.name,
              sublabel: s.country || undefined,
            }))}
            value={form.supplierId}
            onChange={(id) => set("supplierId", id)}
            placeholder="Aucun fournisseur"
            searchPlaceholder="Rechercher un fournisseur…"
            emptyText="Aucun fournisseur trouvé"
            clearable
          />
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="text-sm font-medium mb-3">Marchandise</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="goodsValue">Valeur</Label>
            <div className="flex gap-2">
              <Input
                id="goodsValue"
                type="number"
                step="0.01"
                value={form.goodsValue}
                onChange={(e) => set("goodsValue", e.target.value)}
                placeholder="0.00"
              />
              <Select
                value={form.goodsCurrency}
                onChange={(e) => set("goodsCurrency", e.target.value)}
                className="w-24"
              >
                <option>EUR</option>
                <option>USD</option>
                <option>MAD</option>
                <option>GBP</option>
                <option>CNY</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goodsWeight">Poids (kg)</Label>
            <Input
              id="goodsWeight"
              type="number"
              step="0.001"
              value={form.goodsWeight}
              onChange={(e) => set("goodsWeight", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goodsPackages">Quantité</Label>
            <div className="flex gap-2">
              <Input
                id="goodsPackages"
                type="number"
                value={form.goodsPackages}
                onChange={(e) => set("goodsPackages", e.target.value)}
                className="flex-1"
              />
              <Select
                value={form.goodsPackagingUnit}
                onChange={(e) => set("goodsPackagingUnit", e.target.value as PackagingUnit)}
                className="w-32"
              >
                {Object.entries(PACKAGING_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="goodsDescription">Description</Label>
          <Textarea
            id="goodsDescription"
            value={form.goodsDescription}
            onChange={(e) => set("goodsDescription", e.target.value)}
            placeholder="Nature de la marchandise…"
          />
        </div>
      </div>

      {mode === "edit" && (
        <>
          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="text-sm font-medium mb-3">Douane & MCI</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="controlOffice">Bureau de contrôle</Label>
                <Input
                  id="controlOffice"
                  value={form.controlOffice ?? ""}
                  onChange={(e) => set("controlOffice", e.target.value)}
                  placeholder="Ex. Casablanca-Port"
                />
              </div>
              <div />
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visite douane</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={form.visitDate ?? ""}
                  onChange={(e) => set("visitDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conformityVisitDate">Visite conformité (MCI)</Label>
                <Input
                  id="conformityVisitDate"
                  type="date"
                  value={form.conformityVisitDate ?? ""}
                  onChange={(e) => set("conformityVisitDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="text-sm font-medium mb-3">État du dossier</div>
            <p className="text-[12px] text-[var(--color-fg-3)] mb-3">
              Cochez tous les drapeaux applicables. Ces informations apparaissent en haut du dossier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FlagCheckbox
                label="Facturé"
                checked={!!form.billed}
                onChange={(v) => set("billed", v)}
              />
              <FlagCheckbox
                label="Livré"
                checked={!!form.delivered}
                onChange={(v) => set("delivered", v)}
              />
              <FlagCheckbox
                label="BAE sous réserve de paiement"
                checked={!!form.baeUnderPayment}
                onChange={(v) => set("baeUnderPayment", v)}
              />
              <FlagCheckbox
                label="BAE sous réserve de conformité"
                checked={!!form.baeUnderConformity}
                onChange={(v) => set("baeUnderConformity", v)}
              />
              <FlagCheckbox
                label="En attente validation conformité"
                checked={!!form.awaitingConformityValidation}
                onChange={(v) => set("awaitingConformityValidation", v)}
              />
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="customNote">Autre message / note</Label>
              <Textarea
                id="customNote"
                value={form.customNote ?? ""}
                onChange={(e) => set("customNote", e.target.value)}
                placeholder="Ex. Marchandise sensible, attention à la manutention…"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button disabled={pending}>
          {pending
            ? mode === "edit"
              ? "Enregistrement…"
              : "Création…"
            : mode === "edit"
            ? "Enregistrer"
            : "Créer le dossier"}
        </Button>
      </div>
    </form>
  );
}

function FlagCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--color-accent)] size-4"
      />
      <span className="text-[13px]">{label}</span>
    </label>
  );
}
