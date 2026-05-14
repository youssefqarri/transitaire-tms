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

export function NewDossierForm({ clients, suppliers }: { clients: Client[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
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
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.number || !form.clientId) {
      toast.error("Numéro de dossier et client requis");
      return;
    }
    start(async () => {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création");
        return;
      }
      toast.success("Dossier créé");
      router.push(`/dossiers/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Numéro de dossier (WinApp) *</Label>
          <Input
            id="number"
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder="Ex. D-2026-00123"
            required
          />
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
          <Select id="type" value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="IMPORT">Import</option>
            <option value="EXPORT">Export</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMode">Mode de paiement</Label>
          <Select
            id="paymentMode"
            value={form.paymentMode}
            onChange={(e) => set("paymentMode", e.target.value)}
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

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button disabled={pending}>{pending ? "Création…" : "Créer le dossier"}</Button>
      </div>
    </form>
  );
}
