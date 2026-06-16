"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import {
  INVOICE_ITEM_KIND_LABELS,
  formatMAD,
  totals,
  type LineItem,
} from "@/lib/invoicing";
import type { InvoiceItemKind } from "@/generated/prisma/enums";

type ClientOpt = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  separateDebours: boolean;
};

// Barème proposé : 0 % (débours refacturé à l'identique), 3 % (taxe régionale
// conteneurs au port), 10 % (transport refacturé), 14 %, 20 % (honoraires & frais).
const VAT_RATES = [0, 3, 10, 14, 20] as const;

export function NewInvoiceForm({
  clients,
  suggestedNumber,
}: {
  clients: ClientOpt[];
  suggestedNumber: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [number, setNumber] = useState(suggestedNumber);
  const [clientId, setClientId] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueAt, setDueAt] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [termsOfPayment, setTermsOfPayment] = useState("Paiement à 30 jours");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { kind: "HONORAIRE", description: "Honoraires de transit", quantity: 1, unitPrice: 0, vatRate: 20 },
  ]);

  const computed = useMemo(() => totals(items), [items]);
  const selectedClient = clients.find((c) => c.id === clientId);

  function updateItem<K extends keyof LineItem>(i: number, k: K, v: LineItem[K]) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  }
  function addItem(kind: InvoiceItemKind = "HONORAIRE") {
    setItems((arr) => [
      ...arr,
      {
        kind,
        description: kind === "DEBOURS" ? "Débours douane" : "",
        quantity: 1,
        unitPrice: 0,
        vatRate: kind === "DEBOURS" ? 0 : 20,
      },
    ]);
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Choisir un client");
      return;
    }
    if (items.length === 0) {
      toast.error("Au moins une ligne");
      return;
    }
    if (items.some((it) => !it.description || it.unitPrice < 0 || it.quantity <= 0)) {
      toast.error("Vérifiez les lignes (description, quantité, prix)");
      return;
    }
    start(async () => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          clientId,
          issuedAt,
          dueAt,
          termsOfPayment,
          notes,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(`Facture ${data.number} créée`);
      router.push(`/factures/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="invnum">Numéro (repris de WinApp)</Label>
          <Input
            id="invnum"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="issuedAt">Date d&apos;émission</Label>
          <Input id="issuedAt" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueAt">Échéance</Label>
          <Input id="dueAt" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clientId">Client</Label>
        <Combobox
          id="clientId"
          items={clients.map((c) => ({
            id: c.id,
            label: c.name,
            sublabel: [c.code, c.city].filter(Boolean).join(" · ") || undefined,
          }))}
          value={clientId}
          onChange={setClientId}
          placeholder="Sélectionner un client…"
          searchPlaceholder="Rechercher…"
        />
        {selectedClient?.separateDebours && (
          <p className="text-[11.5px] text-[var(--color-warning)] flex items-start gap-1.5">
            <span>⚠️</span>
            <span>
              Ce client facture ses débours séparément — pensez à établir une facture de
              débours distincte.
            </span>
          </p>
        )}
      </div>

      {/* Lignes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Lignes</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addItem("HONORAIRE")}>
              <Plus /> Honoraires
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem("DEBOURS")}>
              <Plus /> Débours
            </Button>
          </div>
        </div>
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] divide-y divide-[var(--color-border)] overflow-x-auto">
          <div className="grid grid-cols-[140px_minmax(180px,1fr)_80px_120px_96px_120px_36px] gap-3 px-3 py-2 text-[11px] font-medium text-[var(--color-fg-3)] uppercase tracking-wide bg-[var(--color-surface-2)] min-w-[760px]">
            <div>Type</div>
            <div>Description</div>
            <div className="text-right">Qté</div>
            <div className="text-right">PU HT</div>
            <div className="text-right">TVA %</div>
            <div className="text-right">Total HT</div>
            <div />
          </div>
          {items.map((it, i) => {
            const lineHT = it.quantity * it.unitPrice;
            return (
              <div
                key={i}
                className="grid grid-cols-[140px_minmax(180px,1fr)_80px_120px_96px_120px_36px] gap-3 items-center px-3 py-2 min-w-[760px]"
              >
                <Select
                  value={it.kind}
                  onChange={(e) => {
                    const k = e.target.value as InvoiceItemKind;
                    updateItem(i, "kind", k);
                    if (k === "DEBOURS") updateItem(i, "vatRate", 0);
                    else if (it.vatRate === 0) updateItem(i, "vatRate", 20);
                  }}
                >
                  {Object.entries(INVOICE_ITEM_KIND_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </Select>
                <Input
                  value={it.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="Désignation…"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  className="text-right font-mono"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                  className="text-right font-mono"
                />
                <Select
                  value={String(it.vatRate)}
                  onChange={(e) => updateItem(i, "vatRate", Number(e.target.value))}
                  className="text-right font-mono"
                >
                  {(VAT_RATES.includes(it.vatRate as (typeof VAT_RATES)[number])
                    ? VAT_RATES
                    : [it.vatRate, ...VAT_RATES]
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}%
                    </option>
                  ))}
                </Select>
                <div className="text-right font-mono tnum text-[13px] text-[var(--color-fg)]">
                  {formatMAD(lineHT)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(i)}
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="text-[var(--color-fg-mute)]" />
                </Button>
              </div>
            );
          })}
        </div>
        <p className="text-[11.5px] text-[var(--color-fg-3)]">
          <Badge tone="outline">Note</Badge>{" "}
          Débours = refacturés à l&apos;identique, en principe à 0 % (sauf transport refacturé,
          à 10 %). Les lignes à 0 % vont en « Montant Non Taxable », les autres en « Montant Taxable ».
        </p>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="terms">Conditions de paiement</Label>
            <Input
              id="terms"
              value={termsOfPayment}
              onChange={(e) => setTermsOfPayment(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires…"
            />
          </div>
        </div>
        <div className="space-y-2 border border-[var(--color-border)] rounded-[var(--radius)] p-4 bg-[var(--color-surface-2)] self-start">
          <Row label="Total Non Taxable" value={formatMAD(computed.totalNonTaxable)} />
          <Row label="Total Taxable" value={formatMAD(computed.totalTaxable)} />
          {computed.vatByRate.map((v) => (
            <Row key={v.rate} label={`TVA ${v.rate} %`} value={formatMAD(v.amount)} />
          ))}
          <div className="border-t border-[var(--color-border)] my-2" />
          <Row label="Total TTC" value={formatMAD(computed.totalTTC)} bold />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button disabled={pending}>{pending ? "Création…" : "Créer la facture"}</Button>
      </div>
    </form>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-[13px] ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]"}>{label}</span>
      <span className="font-mono tnum">{value}</span>
    </div>
  );
}
