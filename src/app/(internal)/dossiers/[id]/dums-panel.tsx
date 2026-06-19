"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FileText, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import { DUM_REGIMES, MAX_DUMS_PER_DOSSIER } from "@/lib/reference";
import { formatMAD } from "@/lib/invoicing";
import type { DUMStatus } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/utils";

type DUM = {
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

const fmt = (n: number | null) => (n == null ? "—" : formatMAD(n));
const toDateInput = (d: Date | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export function DUMsPanel({
  dossierId,
  dums,
  canCreate,
}: {
  dossierId: string;
  dums: DUM[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [number, setNumber] = useState("");
  const [bureau, setBureau] = useState("");
  const [regime, setRegime] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [customsValue, setCustomsValue] = useState("");
  const [estimatedDuties, setEstimatedDuties] = useState("");
  const [articleCount, setArticleCount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const atMax = dums.length >= MAX_DUMS_PER_DOSSIER;
  const numOrUndef = (s: string) => (s.trim() === "" ? undefined : Number(s));
  const intOrUndef = (s: string) =>
    s.trim() === "" ? undefined : Math.max(0, Math.floor(Number(s)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!number) {
      toast.error("Numéro DUM requis");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/dums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          bureau,
          regime,
          registeredAt: registeredAt || undefined,
          customsValue: numOrUndef(customsValue),
          estimatedDuties: numOrUndef(estimatedDuties),
          articleCount: intOrUndef(articleCount),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erreur (numéro déjà utilisé ?)");
        return;
      }
      toast.success("DUM créée");
      setNumber("");
      setBureau("");
      setRegime("");
      setRegisteredAt("");
      setCustomsValue("");
      setEstimatedDuties("");
      setArticleCount("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          DUMs
          <span className="ml-2 text-[11.5px] font-normal text-[var(--color-fg-3)] tnum">
            {dums.length}
          </span>
        </CardTitle>
        {canCreate && !atMax && (
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <Plus /> Nouvelle DUM
          </Button>
        )}
      </CardHeader>

      {open && (
        <form onSubmit={submit} className="px-5 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="dumnum">Numéro DUM</Label>
            <Input id="dumnum" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumregime">Régime douanier</Label>
            <Select id="dumregime" value={regime} onChange={(e) => setRegime(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {DUM_REGIMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bureau">Bureau douane</Label>
            <Input id="bureau" value={bureau} onChange={(e) => setBureau(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumdate">Date d&apos;enregistrement</Label>
            <Input
              id="dumdate"
              type="date"
              value={registeredAt}
              onChange={(e) => setRegisteredAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumcv">Valeur en douane (MAD)</Label>
            <Input
              id="dumcv"
              type="number"
              step="0.01"
              min="0"
              value={customsValue}
              onChange={(e) => setCustomsValue(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumed">Droits &amp; taxes estimés (MAD)</Label>
            <Input
              id="dumed"
              type="number"
              step="0.01"
              min="0"
              value={estimatedDuties}
              onChange={(e) => setEstimatedDuties(e.target.value)}
              className="font-mono"
              placeholder="Estimation avant BADR"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dumart">Nombre d&apos;articles</Label>
            <Input
              id="dumart"
              type="number"
              min="0"
              step="1"
              value={articleCount}
              onChange={(e) => setArticleCount(e.target.value)}
              className="font-mono"
              placeholder="ex. 6 — pour le tarif syndical"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-[var(--color-border)]">
        {dums.length === 0 && (
          <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucune DUM enregistrée. Elle sera créée après dépôt sur BADR.
          </div>
        )}
        {dums.map((d) =>
          editingId === d.id ? (
            <LiquidationForm
              key={d.id}
              dossierId={dossierId}
              dum={d}
              onDone={() => {
                setEditingId(null);
                router.refresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={d.id} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[13px] font-medium text-[var(--color-fg)]">{d.number}</span>
                    {d.regime && <Badge tone="neutral">{d.regime}</Badge>}
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                    {d.bureau ?? "Bureau ?"} · enregistré le {formatDate(d.registeredAt)}
                  </div>
                </div>
                <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
                {canCreate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingId(d.id)}
                    aria-label="Saisir la liquidation"
                  >
                    <Pencil className="text-[var(--color-fg-mute)]" />
                  </Button>
                )}
              </div>
              {(d.customsValue != null ||
                d.estimatedDuties != null ||
                d.liquidatedDuties != null ||
                d.receiptNumber ||
                d.paidAt ||
                d.articleCount != null) && (
                <dl className="mt-2.5 ml-7 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11.5px]">
                  <Field label="Valeur en douane" value={fmt(d.customsValue)} />
                  <Field label="Nombre d'articles" value={d.articleCount != null ? String(d.articleCount) : "—"} />
                  <Field label="Droits estimés" value={fmt(d.estimatedDuties)} />
                  <Field label="Droits liquidés" value={fmt(d.liquidatedDuties)} strong />
                  <Field label="N° quittance" value={d.receiptNumber || "—"} />
                  <Field label="Payé le" value={d.paidAt ? formatDate(d.paidAt) : "—"} />
                </dl>
              )}
            </div>
          ),
        )}
        {canCreate && atMax && (
          <div className="px-5 py-2.5 text-[11.5px] text-[var(--color-fg-3)] bg-[var(--color-surface-2)]">
            Maximum {MAX_DUMS_PER_DOSSIER} DUM par dossier atteint (un dossier peut cumuler 2 régimes).
          </div>
        )}
      </div>
    </Card>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--color-fg-3)]">{label}</dt>
      <dd className={`font-mono tnum ${strong ? "text-[var(--color-fg)] font-medium" : "text-[var(--color-fg-2)]"}`}>
        {value}
      </dd>
    </div>
  );
}

function LiquidationForm({
  dossierId,
  dum,
  onDone,
  onCancel,
}: {
  dossierId: string;
  dum: DUM;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, start] = useTransition();
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
    <div className="px-5 py-4 bg-[var(--color-surface-2)] animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
        <span className="font-mono text-[13px] font-medium text-[var(--color-fg)]">{dum.number}</span>
        <span className="text-[11.5px] text-[var(--color-fg-3)]">— liquidation des droits &amp; taxes</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div className="space-y-1.5">
          <Label>N° de quittance</Label>
          <Input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Date de paiement</Label>
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
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
