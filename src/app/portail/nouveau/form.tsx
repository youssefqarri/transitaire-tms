"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function NewDossierForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reference, setReference] = useState("");
  const [type, setType] = useState<"IMPORT" | "EXPORT">("IMPORT");
  const [paymentMode, setPaymentMode] = useState<"WITH_PAYMENT" | "WITHOUT_PAYMENT">(
    "WITHOUT_PAYMENT",
  );
  const [supplierName, setSupplierName] = useState("");
  const [goodsValue, setGoodsValue] = useState("");
  const [goodsCurrency, setGoodsCurrency] = useState("EUR");
  const [goodsWeight, setGoodsWeight] = useState("");
  const [goodsPackages, setGoodsPackages] = useState("");
  const [goodsPackagingUnit, setGoodsPackagingUnit] = useState<
    "COLIS" | "PALETTES" | "CONTENEURS"
  >("COLIS");
  const [goodsDescription, setGoodsDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/portail/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.trim() || undefined,
          type,
          paymentMode,
          supplierName: supplierName.trim() || undefined,
          goodsValue: goodsValue.trim() || undefined,
          goodsCurrency,
          goodsWeight: goodsWeight.trim() || undefined,
          goodsPackages: goodsPackages.trim() || undefined,
          goodsPackagingUnit,
          goodsDescription: goodsDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erreur lors de la création");
        return;
      }
      const data = await res.json();
      toast.success(`Dossier ${data.number} créé. Notre équipe est notifiée.`);
      router.push(`/portail/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reference">
            Référence <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
          </Label>
          <Input
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ex. PO-2026-001"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select id="type" value={type} onChange={(e) => setType(e.target.value as "IMPORT" | "EXPORT")}>
            <option value="IMPORT">Import</option>
            <option value="EXPORT">Export</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paymentMode">Mode de paiement</Label>
          <Select
            id="paymentMode"
            value={paymentMode}
            onChange={(e) =>
              setPaymentMode(e.target.value as "WITH_PAYMENT" | "WITHOUT_PAYMENT")
            }
          >
            <option value="WITHOUT_PAYMENT">Sans paiement</option>
            <option value="WITH_PAYMENT">Avec paiement (engagement d&apos;importation)</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier">
            Fournisseur <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
          </Label>
          <Input
            id="supplier"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Nom du fournisseur"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="goodsValue">
            Valeur marchandise <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
          </Label>
          <Input
            id="goodsValue"
            type="number"
            step="0.01"
            value={goodsValue}
            onChange={(e) => setGoodsValue(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Devise</Label>
          <Select
            id="currency"
            value={goodsCurrency}
            onChange={(e) => setGoodsCurrency(e.target.value)}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="MAD">MAD</option>
            <option value="GBP">GBP</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="weight">
            Poids (kg) <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={goodsWeight}
            onChange={(e) => setGoodsWeight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="packages">Nombre</Label>
          <Input
            id="packages"
            type="number"
            value={goodsPackages}
            onChange={(e) => setGoodsPackages(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unité</Label>
          <Select
            id="unit"
            value={goodsPackagingUnit}
            onChange={(e) =>
              setGoodsPackagingUnit(
                e.target.value as "COLIS" | "PALETTES" | "CONTENEURS",
              )
            }
          >
            <option value="COLIS">Colis</option>
            <option value="PALETTES">Palettes</option>
            <option value="CONTENEURS">Conteneurs</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description marchandise{" "}
          <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
        </Label>
        <textarea
          id="description"
          value={goodsDescription}
          onChange={(e) => setGoodsDescription(e.target.value)}
          rows={3}
          placeholder="Précisez la nature de la marchandise…"
          className="w-full px-3 py-2 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent resize-y"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" disabled={pending}>
          {pending ? "Création…" : "Créer le dossier"}
        </Button>
      </div>
    </form>
  );
}
