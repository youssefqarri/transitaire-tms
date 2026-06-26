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
import { CURRENCIES } from "@/lib/currencies";
import { CONTROL_ORGANISMS, REGULATORY_SERVICES } from "@/lib/reference";
import { transportDocLabel } from "@/lib/statuses";

type Client = { id: string; name: string; code?: string | null; city?: string | null };
type Supplier = { id: string; name: string; country?: string | null };

type PackagingUnit = "COLIS" | "PALETTES" | "CONTENEURS" | "REMORQUES";

const PACKAGING_LABELS: Record<PackagingUnit, string> = {
  COLIS: "Colis",
  PALETTES: "Palettes",
  CONTENEURS: "Conteneurs",
  REMORQUES: "Remorques",
};

type FormState = {
  number: string;
  reference: string;
  clientReference: string;
  transportRegistration: string;
  type: "IMPORT" | "EXPORT";
  paymentMode: "WITH_PAYMENT" | "WITHOUT_PAYMENT";
  transport: "" | "MARITIME" | "AERIEN" | "ROUTIER";
  clientId: string;
  /** Nom d'un nouveau client saisi à la volée (créé à l'enregistrement si clientId vide). */
  clientName: string;
  supplierId: string;
  /** Nom d'un nouveau fournisseur saisi à la volée (créé à l'enregistrement si supplierId vide). */
  supplierName: string;
  goodsValue: string;
  goodsCurrency: string;
  goodsWeight: string;
  goodsPackages: string;
  goodsPackagingUnit: PackagingUnit;
  goodsDescription: string;
  controlOffice?: string;
  controlOrganism?: string;
  regulatoryServices?: string[];
  visitDate?: string;
  visitEffectiveDate?: string;
  conformityVisitDate?: string;
  conformityVisitEffectiveDate?: string;
  deliveredAt?: string;
  // drapeaux parallèles (édition uniquement)
  billed?: boolean;
  delivered?: boolean;
  baeUnderPayment?: boolean;
  baeUnderConformity?: boolean;
  awaitingConformityValidation?: boolean;
  customNote?: string;
};

// Identifiant sentinelle pour afficher un fournisseur saisi à la volée (pas encore en base).
const NEW_SUPPLIER = "__new_supplier__";
const NEW_CLIENT = "__new_client__";

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
    clientReference: "",
    transportRegistration: "",
    type: "IMPORT",
    paymentMode: "WITH_PAYMENT",
    transport: "",
    clientId: clients[0]?.id ?? "",
    clientName: "",
    supplierId: "",
    supplierName: "",
    goodsValue: "",
    goodsCurrency: "EUR",
    goodsWeight: "",
    goodsPackages: "",
    goodsPackagingUnit: "COLIS",
    goodsDescription: "",
    controlOffice: "",
    controlOrganism: "",
    regulatoryServices: [],
    visitDate: "",
    visitEffectiveDate: "",
    conformityVisitDate: "",
    conformityVisitEffectiveDate: "",
    deliveredAt: "",
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
    if (!form.clientId && !form.clientName.trim()) {
      toast.error("Client requis");
      return;
    }
    if (mode !== "edit" && !form.transport) {
      toast.error("Mode de transport requis (maritime, aérien ou routier)");
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
              clientReference: form.clientReference || null,
              transportRegistration: form.transportRegistration || null,
              clientId: form.clientId,
              clientName: form.clientName || undefined,
              supplierId: form.supplierId || null,
              supplierName: form.supplierName || undefined,
              transport: form.transport || null,
              goodsValue: form.goodsValue ? Number(form.goodsValue) : null,
              goodsCurrency: form.goodsCurrency,
              goodsWeight: form.goodsWeight ? Number(form.goodsWeight) : null,
              goodsPackages: form.goodsPackages ? Number(form.goodsPackages) : null,
              goodsPackagingUnit: form.goodsPackagingUnit,
              goodsDescription: form.goodsDescription || null,
              controlOffice: form.controlOffice || null,
              controlOrganism: form.controlOrganism || null,
              regulatoryServices: form.regulatoryServices ?? [],
              visitDate: form.visitDate || null,
              visitEffectiveDate: form.visitEffectiveDate || null,
              conformityVisitDate: form.conformityVisitDate || null,
              conformityVisitEffectiveDate: form.conformityVisitEffectiveDate || null,
              deliveredAt: form.deliveredAt || null,
              hasVisit: !!form.visitDate,
              hasConformityVisit: !!form.conformityVisitDate,
              billed: !!form.billed,
              delivered: !!form.delivered || !!form.deliveredAt,
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
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3.5">
        <div className="space-y-2">
          <Label htmlFor="number">Numéro de dossier</Label>
          <Input
            id="number"
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder={mode === "create" ? "Laisser vide pour un numéro provisoire" : "Ex. D-2026-00123"}
          />
          <p className="text-[11px] text-[var(--color-fg-mute)]">
            {mode === "create"
              ? "Optionnel : un numéro provisoire PROV-AAAA-NNNN sera attribué si vide, à remplacer par le numéro de dossier définitif quand il sera disponible."
              : "Modifiable — pour remplacer un numéro provisoire par le numéro de dossier définitif."}
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
          <Label htmlFor="clientReference">V/Réf (référence client)</Label>
          <Input
            id="clientReference"
            value={form.clientReference}
            onChange={(e) => set("clientReference", e.target.value)}
            placeholder="Référence / N° de commande du client (reportée sur la facture)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transportRegistration">
            {transportDocLabel(form.transport || null)} — titre de transport (optionnel)
          </Label>
          <Input
            id="transportRegistration"
            value={form.transportRegistration}
            onChange={(e) => set("transportRegistration", e.target.value)}
            placeholder="Connaissement / LTA / CMR"
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
          <Label htmlFor="transport">
            Mode de transport
            {mode !== "edit" && <span className="text-[var(--color-danger)]"> *</span>}
          </Label>
          <Select
            id="transport"
            value={form.transport}
            onChange={(e) => set("transport", e.target.value as FormState["transport"])}
          >
            <option value="">— Sélectionner —</option>
            <option value="MARITIME">Maritime (connaissement / BL)</option>
            <option value="AERIEN">Aérien (LTA)</option>
            <option value="ROUTIER">Routier (CMR)</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">Client *</Label>
          <Combobox
            id="clientId"
            items={[
              ...clients.map((c) => ({
                id: c.id,
                label: c.name,
                sublabel: [c.code, c.city].filter(Boolean).join(" • ") || undefined,
              })),
              ...(form.clientName
                ? [{ id: NEW_CLIENT, label: form.clientName, sublabel: "Nouveau client" }]
                : []),
            ]}
            value={form.clientName ? NEW_CLIENT : form.clientId}
            onChange={(id) => {
              if (id === NEW_CLIENT) return;
              setForm((f) => ({ ...f, clientId: id, clientName: "" }));
            }}
            onCreate={(name) => setForm((f) => ({ ...f, clientName: name, clientId: "" }))}
            placeholder="Sélectionner un client…"
            searchPlaceholder="Rechercher ou saisir un nouveau client…"
            emptyText="Aucun client trouvé"
          />
          {form.clientName && (
            <p className="text-[11px] text-[var(--color-fg-mute)]">
              Nouveau client « {form.clientName} » — créé et ajouté à la liste à
              l&apos;enregistrement.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplierId">Fournisseur</Label>
          <Combobox
            id="supplierId"
            items={[
              ...suppliers.map((s) => ({
                id: s.id,
                label: s.name,
                sublabel: s.country || undefined,
              })),
              ...(form.supplierName
                ? [{ id: NEW_SUPPLIER, label: form.supplierName, sublabel: "Nouveau fournisseur" }]
                : []),
            ]}
            value={form.supplierName ? NEW_SUPPLIER : form.supplierId}
            onChange={(id) => {
              if (id === NEW_SUPPLIER) return;
              setForm((f) => ({ ...f, supplierId: id, supplierName: "" }));
            }}
            onCreate={(name) => setForm((f) => ({ ...f, supplierName: name, supplierId: "" }))}
            placeholder="Aucun fournisseur"
            searchPlaceholder="Rechercher ou saisir un nouveau fournisseur…"
            emptyText="Aucun fournisseur trouvé"
            clearable
          />
          <p className="text-[11px] text-[var(--color-fg-mute)]">
            Tapez un nom absent de la liste puis « Ajouter » : il sera créé et ajouté
            aux fournisseurs à l&apos;enregistrement.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-5">
        <div className="text-[14px] font-medium mb-3">Marchandise</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3.5">
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
              <div className="w-32">
                <Combobox
                  items={CURRENCIES.map((c) => ({
                    id: c.code,
                    label: c.code,
                    sublabel: c.name,
                    pinned: c.pinned,
                  }))}
                  value={form.goodsCurrency}
                  onChange={(v) => set("goodsCurrency", v)}
                  placeholder="EUR"
                  searchPlaceholder="Code ou nom…"
                />
              </div>
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
                type="text"
                inputMode="numeric"
                placeholder="Nombre"
                value={form.goodsPackages}
                onChange={(e) => set("goodsPackages", e.target.value.replace(/\D/g, ""))}
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
          <div className="border-t border-[var(--color-border)] pt-5">
            <div className="text-[14px] font-medium mb-3">Douane & Organismes de contrôle</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3.5">
              <div className="space-y-2">
                <Label htmlFor="controlOffice">Bureau de contrôle</Label>
                <Input
                  id="controlOffice"
                  value={form.controlOffice ?? ""}
                  onChange={(e) => set("controlOffice", e.target.value)}
                  placeholder="Ex. Casablanca-Port"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="controlOrganism">Organisme de contrôle</Label>
                <Select
                  id="controlOrganism"
                  value={form.controlOrganism ?? ""}
                  onChange={(e) => set("controlOrganism", e.target.value)}
                >
                  <option value="">— Aucun —</option>
                  {CONTROL_ORGANISMS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label>Services réglementaires (selon le produit)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REGULATORY_SERVICES.map((s) => {
                    const selected = form.regulatoryServices ?? [];
                    const checked = selected.includes(s);
                    return (
                      <FlagCheckbox
                        key={s}
                        label={s}
                        checked={checked}
                        onChange={(v) =>
                          set(
                            "regulatoryServices",
                            v ? [...selected, s] : selected.filter((x) => x !== s),
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitDate">Date de visite douane</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={form.visitDate ?? ""}
                  onChange={(e) => set("visitDate", e.target.value)}
                />
                <p className="text-[11px] text-[var(--color-fg-mute)]">
                  Date où la visite a eu lieu (effective).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conformityVisitDate">
                  Date de visite des organismes de contrôle
                </Label>
                <Input
                  id="conformityVisitDate"
                  type="date"
                  value={form.conformityVisitDate ?? ""}
                  onChange={(e) => set("conformityVisitDate", e.target.value)}
                />
                <p className="text-[11px] text-[var(--color-fg-mute)]">
                  Visite de conformité (phyto, MCA, fraude, etc.) — date effective.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveredAt">Date de livraison</Label>
                <Input
                  id="deliveredAt"
                  type="date"
                  value={form.deliveredAt ?? ""}
                  onChange={(e) => set("deliveredAt", e.target.value)}
                />
              </div>
              <div />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-5">
            <div className="text-[14px] font-medium mb-3">État du dossier</div>
            <p className="text-[12px] text-[var(--color-fg-3)] mb-3">
              Cochez tous les drapeaux applicables. Ces informations apparaissent en haut du dossier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
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
