"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import type { DUMStatus } from "@/generated/prisma/enums";

/** Forme sérialisable d'un DUM (Decimals convertis en number). */
export type DUM = {
  id: string;
  number: string;
  status: DUMStatus;
  bureau: string | null;
  regime: string | null;
  registeredAt: Date | null;
  liquidatedAt: Date | null;
  customsValue: number | null;
  estimatedDuties: number | null;
  liquidatedDuties: number | null;
  receiptNumber: string | null;
  paidAt: Date | null;
  articleCount: number | null;
};

export const toDateInput = (d: Date | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

/**
 * Formulaire d'édition (liquidation) d'un DUM existant. Partagé entre le panneau
 * DUMs du dossier et la page détail DUM — même logique, même endpoint
 * `PATCH /api/dossiers/[id]/dums/[dumId]`, zéro duplication.
 */
export function LiquidationForm({
  dossierId,
  dum,
  canEditNumber,
  onDone,
  onCancel,
}: {
  dossierId: string;
  dum: DUM;
  canEditNumber: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, start] = useTransition();
  const [number, setNumber] = useState(dum.number);
  const [status, setStatus] = useState<DUMStatus>(dum.status);
  const [customsValue, setCustomsValue] = useState(dum.customsValue?.toString() ?? "");
  const [estimatedDuties, setEstimatedDuties] = useState(dum.estimatedDuties?.toString() ?? "");
  const [liquidatedDuties, setLiquidatedDuties] = useState(dum.liquidatedDuties?.toString() ?? "");
  const [receiptNumber, setReceiptNumber] = useState(dum.receiptNumber ?? "");
  const [paidAt, setPaidAt] = useState(toDateInput(dum.paidAt));
  const [articleCount, setArticleCount] = useState(dum.articleCount?.toString() ?? "");

  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  function save() {
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/dums/${dum.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: canEditNumber && number.trim() && number.trim() !== dum.number ? number.trim() : undefined,
          status,
          customsValue: numOrNull(customsValue),
          estimatedDuties: numOrNull(estimatedDuties),
          liquidatedDuties: numOrNull(liquidatedDuties),
          receiptNumber: receiptNumber.trim() || null,
          paidAt: paidAt || null,
          articleCount:
            articleCount.trim() === "" ? null : Math.max(0, Math.floor(Number(articleCount))),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Liquidation enregistrée");
      onDone();
    });
  }

  return (
    <div className="px-5 py-4 bg-[var(--color-surface)] animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
        <span className="font-mono text-[13px] font-medium text-[var(--color-fg)]">{dum.number}</span>
        <span className="text-[12px] text-[var(--color-fg-3)]">— liquidation des droits &amp; taxes</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Ligne 1 : N° DUM · Nombre d'articles · Statut */}
        <div className="space-y-1.5">
          <Label>N° DUM</Label>
          <span
            className="block"
            title={canEditNumber ? undefined : "Le numéro DUM ne se modifie pas à ce stade"}
          >
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={!canEditNumber}
              className="font-mono w-full"
            />
          </span>
        </div>
        <div className="space-y-1.5">
          <Label>Nombre d&apos;articles</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={articleCount}
            onChange={(e) => setArticleCount(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Statut DUM</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as DUMStatus)}>
            {(Object.keys(DUM_STATUS_LABELS) as DUMStatus[]).map((s) => (
              <option key={s} value={s}>
                {DUM_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        {/* Ligne 2 : Valeur en douane · Droits estimés · Droits liquidés */}
        <div className="space-y-1.5">
          <Label>Valeur en douane (MAD)</Label>
          <Input type="number" step="0.01" min="0" value={customsValue} onChange={(e) => setCustomsValue(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label>Droits &amp; taxes estimés (MAD)</Label>
          <Input type="number" step="0.01" min="0" value={estimatedDuties} onChange={(e) => setEstimatedDuties(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label>Droits &amp; taxes liquidés (MAD)</Label>
          <Input type="number" step="0.01" min="0" value={liquidatedDuties} onChange={(e) => setLiquidatedDuties(e.target.value)} className="font-mono" />
        </div>
        {/* Ligne 3 : N° de quittance · Date de paiement */}
        <div className="space-y-1.5">
          <Label>N° de quittance</Label>
          <Input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Date de paiement</Label>
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
