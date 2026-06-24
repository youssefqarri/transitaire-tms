"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { CURRENCIES } from "@/lib/currencies";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
import type { DocumentCategory } from "@/generated/prisma/enums";

type Attachment = {
  id: string;
  file: File;
  category: DocumentCategory;
};

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
    "COLIS" | "PALETTES" | "CONTENEURS" | "REMORQUES"
  >("COLIS");
  const [goodsDescription, setGoodsDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  function addAttachments(files: FileList | null) {
    if (!files) return;
    const newOnes: Attachment[] = [];
    for (const f of Array.from(files)) {
      newOnes.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        category: "AUTRE",
      });
    }
    setAttachments((prev) => [...prev, ...newOnes]);
  }

  function setAttachmentCategory(id: string, category: DocumentCategory) {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, category } : a)));
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

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

      // Upload des documents joints (s'il y en a)
      if (attachments.length > 0) {
        let uploaded = 0;
        for (const att of attachments) {
          const fd = new FormData();
          fd.append("category", att.category);
          fd.append("file", att.file);
          const upRes = await fetch(`/api/portail/dossiers/${data.id}/documents`, {
            method: "POST",
            body: fd,
          });
          if (upRes.ok) uploaded++;
        }
        toast.success(
          `Dossier ${data.number} créé • ${uploaded}/${attachments.length} document(s) transmis.`,
        );
      } else {
        toast.success(`Dossier ${data.number} créé. Notre équipe est notifiée.`);
      }

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
          <Combobox
            id="currency"
            items={CURRENCIES.map((c) => ({
              id: c.code,
              label: c.code,
              sublabel: c.name,
              pinned: c.pinned,
            }))}
            value={goodsCurrency}
            onChange={setGoodsCurrency}
            placeholder="EUR"
            searchPlaceholder="Code ou nom…"
          />
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
                e.target.value as "COLIS" | "PALETTES" | "CONTENEURS" | "REMORQUES",
              )
            }
          >
            <option value="COLIS">Colis</option>
            <option value="PALETTES">Palettes</option>
            <option value="CONTENEURS">Conteneurs</option>
            <option value="REMORQUES">Remorques</option>
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

      {/* Pièces jointes optionnelles */}
      <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Label>
              Pièces jointes{" "}
              <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
            </Label>
            <p className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
              Vous pouvez joindre dès maintenant facture, BL, etc. Ils seront rattachés au dossier.
            </p>
          </div>
          <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 h-8 rounded-[var(--radius)] border border-[var(--color-border-2)] bg-[var(--color-surface)] text-[12px] hover:bg-[var(--color-surface-2)] transition-colors">
            <Plus className="size-3.5" strokeWidth={2} />
            Ajouter
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.csv"
              className="hidden"
              onChange={(e) => {
                addAttachments(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2 mt-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-[var(--color-surface-2)] rounded-[var(--radius)] px-3 py-2"
              >
                <Paperclip className="size-3.5 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-[var(--color-fg)] truncate flex-1 min-w-0">
                  {att.file.name}
                </span>
                <div className="w-[220px]">
                  <Combobox
                    items={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, l]) => ({
                      id: k,
                      label: l,
                    }))}
                    value={att.category}
                    onChange={(v) => setAttachmentCategory(att.id, v as DocumentCategory)}
                    placeholder="Type…"
                    searchPlaceholder="Rechercher…"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="size-7 rounded flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] shrink-0"
                  aria-label="Retirer le fichier"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" disabled={pending}>
          {pending
            ? attachments.length > 0
              ? "Envoi…"
              : "Création…"
            : attachments.length > 0
              ? `Créer le dossier (${attachments.length} pièce${attachments.length > 1 ? "s" : ""})`
              : "Créer le dossier"}
        </Button>
      </div>
    </form>
  );
}
