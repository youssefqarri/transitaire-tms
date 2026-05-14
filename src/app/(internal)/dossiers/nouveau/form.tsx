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
  goodsDescription: string;
  controlOffice?: string;
  visitDate?: string;
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
    goodsDescription: "",
    controlOffice: "",
    visitDate: "",
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
    if (mode === "create" && !form.number) {
      toast.error("Numéro de dossier requis");
      return;
    }

    start(async () => {
      const url = mode === "edit" ? `/api/dossiers/${dossierId}` : "/api/dossiers";
      const method = mode === "edit" ? "PATCH" : "POST";
      // PATCH attend les nombres en number, POST en string. On formate.
      const body =
        mode === "edit"
          ? {
              reference: form.reference || null,
              clientId: form.clientId,
              supplierId: form.supplierId || null,
              goodsValue: form.goodsValue ? Number(form.goodsValue) : null,
              goodsCurrency: form.goodsCurrency,
              goodsWeight: form.goodsWeight ? Number(form.goodsWeight) : null,
              goodsPackages: form.goodsPackages ? Number(form.goodsPackages) : null,
              goodsDescription: form.goodsDescription || null,
              controlOffice: form.controlOffice || null,
              visitDate: form.visitDate || null,
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
          <Label htmlFor="number">Numéro de dossier (WinApp) {mode === "create" ? "*" : ""}</Label>
          <Input
            id="number"
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder="Ex. D-2026-00123"
            required={mode === "create"}
            disabled={mode === "edit"}
          />
          {mode === "edit" && (
            <p className="text-[11px] text-[var(--color-fg-mute)]">
              Le numéro WinApp ne peut pas être modifié.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference">Référence fournisseur</Label>
          <Input
            id="reference"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="Objet du mail / réf. expéditeur"
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
            <Label htmlFor="goodsPackages">Nb colis</Label>
            <Input
              id="goodsPackages"
              type="number"
              value={form.goodsPackages}
              onChange={(e) => set("goodsPackages", e.target.value)}
            />
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
        <div className="border-t border-[var(--color-border)] pt-6">
          <div className="text-sm font-medium mb-3">Douane</div>
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
            <div className="space-y-2">
              <Label htmlFor="visitDate">Date de visite</Label>
              <Input
                id="visitDate"
                type="date"
                value={form.visitDate ?? ""}
                onChange={(e) => set("visitDate", e.target.value)}
              />
            </div>
          </div>
        </div>
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
