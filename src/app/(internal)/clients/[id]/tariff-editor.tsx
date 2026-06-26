"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { INVOICE_ITEM_KIND_LABELS } from "@/lib/invoicing";
import type { InvoiceItemKind } from "@/generated/prisma/enums";

export type TariffLine = {
  kind: InvoiceItemKind;
  code: string | null;
  description: string;
  unitPrice: number;
  vatRate: number;
};

const VAT_RATES = [0, 3, 10, 14, 20] as const;
const GRID = "grid grid-cols-[90px_120px_minmax(150px,1fr)_120px_84px_36px] gap-2.5 items-center";

export function ClientTariffEditor({
  clientId,
  initial,
}: {
  clientId: string;
  initial: TariffLine[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [lines, setLines] = useState<TariffLine[]>(initial);
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof TariffLine>(i: number, k: K, v: TariffLine[K]) {
    setLines((arr) => arr.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
    setDirty(true);
  }
  function add(kind: InvoiceItemKind = "HONORAIRE") {
    setLines((arr) => [
      ...arr,
      { kind, code: "", description: "", unitPrice: 0, vatRate: kind === "DEBOURS" ? 0 : 20 },
    ]);
    setDirty(true);
  }
  function remove(i: number) {
    setLines((arr) => arr.filter((_, idx) => idx !== i));
    setDirty(true);
  }

  function save() {
    if (lines.some((l) => !l.description.trim())) {
      toast.error("Chaque ligne doit avoir un libellé");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/clients/${clientId}/tariffs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            kind: l.kind,
            code: l.code?.trim() || undefined,
            description: l.description.trim(),
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
          })),
        }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'enregistrement");
        return;
      }
      toast.success("Fiche tarifaire enregistrée");
      setDirty(false);
      router.refresh();
    });
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <p className="text-[12px] text-[var(--color-fg-3)]">
        Lignes récurrentes pré-remplies automatiquement à la création d&apos;une facture pour ce
        client (honoraires, frais portuaires, transport…). Les débours, variables, restent saisis
        au cas par cas.
      </p>

      {lines.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[640px] space-y-2">
            <div
              className={`${GRID} text-[11px] font-medium text-[var(--color-fg-3)] uppercase tracking-wide`}
            >
              <div>Code</div>
              <div>Type</div>
              <div>Libellé</div>
              <div className="text-right">Montant (DH)</div>
              <div className="text-right">TVA %</div>
              <div />
            </div>
            {lines.map((l, i) => (
              <div key={i} className={GRID}>
                <Input
                  value={l.code ?? ""}
                  onChange={(e) => update(i, "code", e.target.value)}
                  placeholder="Code"
                  className="font-mono"
                />
                <Select
                  value={l.kind}
                  onChange={(e) => {
                    const k = e.target.value as InvoiceItemKind;
                    update(i, "kind", k);
                    if (k === "DEBOURS") update(i, "vatRate", 0);
                    else if (l.vatRate === 0) update(i, "vatRate", 20);
                  }}
                >
                  {Object.entries(INVOICE_ITEM_KIND_LABELS).map(([k, lab]) => (
                    <option key={k} value={k}>
                      {lab}
                    </option>
                  ))}
                </Select>
                <Input
                  value={l.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="ex. Honoraires, Visite portuaire, Engagement d'importation…"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={l.unitPrice}
                  onChange={(e) => update(i, "unitPrice", Number(e.target.value))}
                  className="text-right font-mono"
                />
                <Select
                  value={String(l.vatRate)}
                  onChange={(e) => update(i, "vatRate", Number(e.target.value))}
                  className="text-right font-mono"
                >
                  {(VAT_RATES.includes(l.vatRate as (typeof VAT_RATES)[number])
                    ? VAT_RATES
                    : [l.vatRate, ...VAT_RATES]
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}%
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="text-[var(--color-fg-mute)]" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {lines.length === 0 && (
        <div className="text-[13px] text-center text-[var(--color-fg-3)] py-2">
          Aucun tarif récurrent enregistré pour ce client.
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          <Button type="button" variant="soft" size="sm" onClick={() => add("HONORAIRE")}>
            <Plus /> Ajouter une ligne
          </Button>
          <Button type="button" variant="soft" size="sm" onClick={() => add("DEBOURS")}>
            <Plus /> Débours (0 %)
          </Button>
        </div>
        <Button size="sm" onClick={save} disabled={pending || !dirty}>
          {pending ? "Enregistrement…" : "Enregistrer la fiche"}
        </Button>
      </div>
    </div>
  );
}
