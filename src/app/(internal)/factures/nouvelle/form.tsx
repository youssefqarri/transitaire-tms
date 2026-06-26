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
  normalizeDesignation,
  totals,
  type LineItem,
} from "@/lib/invoicing";
import type { InvoiceItemKind } from "@/generated/prisma/enums";
import { SyndicalCalculator } from "./syndical-calculator";

type ClientOpt = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  separateDebours: boolean;
};

type DossierOpt = {
  id: string;
  number: string;
  reference: string | null;
  clientId: string;
  customsValue: number | null;
  customsDuties: number | null;
  articleCount: number | null;
  transport: string | null;
};

// Barème TVA proposé : 0 % (débours refacturé à l'identique), 10 % (transport
// refacturé), 14 %, 20 % (honoraires & frais). NB : la taxe régionale (3 % du
// total taxable, conteneurs maritimes) n'est PAS un taux de TVA — elle a son
// propre bouton et s'ajoute en ligne à 20 %.
const VAT_RATES = [0, 10, 14, 20] as const;

export type InvoiceEditInit = {
  id: string;
  number: string;
  clientId: string;
  dossierId: string;
  issuedAt: string;
  dueAt: string;
  termsOfPayment: string;
  notes: string;
  items: LineItem[];
};

export function NewInvoiceForm({
  clients,
  dossiers,
  suggestedNumber,
  edit,
}: {
  clients: ClientOpt[];
  dossiers: DossierOpt[];
  suggestedNumber: string;
  edit?: InvoiceEditInit;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [number, setNumber] = useState(edit?.number ?? suggestedNumber);
  const [clientId, setClientId] = useState(edit?.clientId ?? "");
  const [dossierId, setDossierId] = useState(edit?.dossierId ?? "");
  const [issuedAt, setIssuedAt] = useState(
    edit?.issuedAt ?? new Date().toISOString().slice(0, 10),
  );
  const [dueAt, setDueAt] = useState(
    edit?.dueAt ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [termsOfPayment, setTermsOfPayment] = useState(
    edit?.termsOfPayment ?? "Paiement à 30 jours",
  );
  const [notes, setNotes] = useState(edit?.notes ?? "");
  const [items, setItems] = useState<LineItem[]>(
    edit?.items ?? [
      { kind: "HONORAIRE", code: "", description: "Honoraires de transit", quantity: 1, unitPrice: 0, vatRate: 20 },
    ],
  );

  const computed = useMemo(() => totals(items), [items]);
  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedDossier = dossiers.find((d) => d.id === dossierId);

  function applyHonoraire(amount: number, description: string) {
    setItems((arr) => {
      const idx = arr.findIndex((it) => it.kind === "HONORAIRE");
      if (idx >= 0) {
        return arr.map((it, i) =>
          i === idx
            ? { ...it, description, unitPrice: amount, vatRate: it.vatRate || 20, code: it.code || "HON" }
            : it,
        );
      }
      return [
        ...arr,
        { kind: "HONORAIRE", code: "HON", description, quantity: 1, unitPrice: amount, vatRate: 20 },
      ];
    });
    toast.success(`Honoraires : ${formatMAD(amount)}`);
  }

  function updateItem<K extends keyof LineItem>(i: number, k: K, v: LineItem[K]) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  }
  function addItem(kind: InvoiceItemKind = "HONORAIRE") {
    setItems((arr) => [
      ...arr,
      {
        kind,
        code: "",
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

  // Taxe régionale (conteneurs maritimes au port) = 3 % du total des montants
  // TAXABLES (lignes à TVA > 0), hors la taxe elle-même ; ajoutée à 20 % de TVA.
  // Affichée uniquement pour les dossiers maritimes (cf. règle cliente : pas
  // d'aérien). Action manuelle → gère naturellement le cas « maritime en colis ».
  function applyTaxeRegionale() {
    const base = items
      .filter((it) => it.code !== "TAXREG" && Number(it.vatRate) > 0)
      .reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    if (base <= 0) {
      toast.error("Ajoutez d'abord les lignes taxables (TVA > 0)");
      return;
    }
    const montant = Math.round(base * 0.03 * 100) / 100;
    const line: LineItem = {
      kind: "HONORAIRE",
      code: "TAXREG",
      description: "Taxe régionale (3 %)",
      quantity: 1,
      unitPrice: montant,
      vatRate: 20,
    };
    setItems((arr) => {
      const idx = arr.findIndex((it) => it.code === "TAXREG");
      return idx >= 0 ? arr.map((it, i) => (i === idx ? line : it)) : [...arr, line];
    });
    toast.success(`Taxe régionale (3 %) : ${formatMAD(montant)}`);
  }

  // À la sélection d'un client, pré-remplit les lignes depuis sa fiche tarifaire
  // récurrente (point 6 cliente). Les débours, variables, restent à ajouter ensuite.
  async function onClientChange(id: string) {
    setClientId(id);
    if (!id) return;
    if (edit) return; // édition : ne pas écraser les lignes existantes
    try {
      const res = await fetch(`/api/clients/${id}/tariffs`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items?: Array<{
          kind: InvoiceItemKind;
          code: string | null;
          description: string;
          unitPrice: number;
          vatRate: number;
        }>;
      };
      const tariffs = data.items ?? [];
      if (tariffs.length === 0) return;
      setItems(
        tariffs.map((t) => ({
          kind: t.kind,
          code: t.code ?? "",
          description: normalizeDesignation(t.description),
          quantity: 1,
          unitPrice: t.unitPrice,
          vatRate: t.vatRate,
        })),
      );
      const name = clients.find((c) => c.id === id)?.name ?? "ce client";
      toast.success(
        `Fiche tarifaire de ${name} appliquée (${tariffs.length} ligne${tariffs.length > 1 ? "s" : ""}) — ajoutez les débours`,
      );
    } catch {
      // silencieux : si la fiche n'est pas récupérable, on garde les lignes en cours
    }
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
      const res = await fetch(edit ? `/api/invoices/${edit.id}` : "/api/invoices", {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(edit ? {} : { number }),
          clientId,
          dossierId: dossierId ? dossierId : edit ? null : undefined,
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
      if (edit) {
        toast.success("Facture modifiée");
        router.push(`/factures/${edit.id}`);
      } else {
        toast.success(`Facture ${data.number} créée`);
        router.push(`/factures/${data.id}`);
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="invnum">Numéro (optionnel)</Label>
          <Input
            id="invnum"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="font-mono"
            disabled={!!edit}
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
            sublabel: [c.code, c.city].filter(Boolean).join(" • ") || undefined,
          }))}
          value={clientId}
          onChange={onClientChange}
          placeholder="Sélectionner un client…"
          searchPlaceholder="Rechercher…"
        />
        {selectedClient?.separateDebours && (
          <p className="text-[12px] text-[var(--color-warning)] flex items-start gap-1.5">
            <span>⚠️</span>
            <span>
              Ce client facture ses débours séparément — pensez à établir une facture de
              débours distincte.
            </span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dossierId">Dossier de référence (optionnel)</Label>
        <Combobox
          id="dossierId"
          items={dossiers.map((d) => ({
            id: d.id,
            label: d.number,
            sublabel: d.reference || undefined,
          }))}
          value={dossierId}
          onChange={(id) => {
            setDossierId(id);
            // Le client remonte automatiquement du dossier choisi (en plus des
            // infos douane déjà reprises pour le tarif syndical).
            const d = dossiers.find((x) => x.id === id);
            if (d) setClientId(d.clientId);
          }}
          placeholder="Aucun / sélectionner un dossier…"
          searchPlaceholder="Rechercher…"
        />
      </div>

      <SyndicalCalculator
        customsValue={selectedDossier?.customsValue ?? null}
        customsDuties={selectedDossier?.customsDuties ?? null}
        articleCount={selectedDossier?.articleCount ?? null}
        onApply={applyHonoraire}
      />

      {/* Lignes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Lignes de facturation</Label>
          <div className="flex gap-2">
            <Button type="button" variant="soft" size="sm" onClick={() => addItem("HONORAIRE")}>
              <Plus /> Ajouter une ligne
            </Button>
            <Button type="button" variant="soft" size="sm" onClick={() => addItem("DEBOURS")}>
              <Plus /> Débours (0 %)
            </Button>
            {selectedDossier?.transport === "MARITIME" && (
              <Button
                type="button"
                variant="soft"
                size="sm"
                onClick={applyTaxeRegionale}
                title="Conteneurs maritimes : 3 % du total des montants taxables"
              >
                <Plus /> Taxe régionale (3 %)
              </Button>
            )}
          </div>
        </div>
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] divide-y divide-[var(--color-border)] overflow-x-auto">
          <div className="grid grid-cols-[84px_128px_minmax(150px,1fr)_70px_104px_84px_104px_36px] gap-3 px-3 py-2 text-[11px] font-medium text-[var(--color-fg-3)] uppercase tracking-wide bg-[var(--color-surface-2)] min-w-[860px]">
            <div>Code</div>
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
                className="grid grid-cols-[84px_128px_minmax(150px,1fr)_70px_104px_84px_104px_36px] gap-3 items-center px-3 py-2 min-w-[860px]"
              >
                <Input
                  value={it.code ?? ""}
                  onChange={(e) => updateItem(i, "code", e.target.value)}
                  placeholder="Code"
                  className="font-mono"
                />
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
                  onBlur={(e) => updateItem(i, "description", normalizeDesignation(e.target.value))}
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
          <button
            type="button"
            onClick={() => addItem("HONORAIRE")}
            className="w-full px-3 py-2.5 text-[13px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] flex items-center justify-center gap-1.5 min-w-[860px]"
          >
            <Plus className="size-4" /> Ajouter une ligne
          </button>
        </div>
        <p className="text-[12px] text-[var(--color-fg-3)]">
          <Badge tone="outline">Note</Badge>{" "}
          Débours = refacturés à l&apos;identique, en principe à 0 % (sauf transport refacturé,
          à 10 %). Les lignes à 0 % vont en « Montant non taxable », les autres en « Montant taxable ».
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
        <div className="space-y-2 border border-[var(--color-border)] rounded-[var(--radius)] p-4 bg-[var(--color-surface-2)] self-end">
          <Row label="Total non taxable" value={formatMAD(computed.totalNonTaxable)} />
          <Row label="Total taxable" value={formatMAD(computed.totalTaxable)} />
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
        <Button disabled={pending}>
          {pending
            ? edit
              ? "Enregistrement…"
              : "Création…"
            : edit
            ? "Enregistrer les modifications"
            : "Créer la facture"}
        </Button>
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
