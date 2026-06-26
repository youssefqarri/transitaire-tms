"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FileText, Pencil, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import { DumStatusBadge } from "@/components/dossier/dum-status-badge";
import { CUSTOMS_REGIME_GROUPS, regimeDisplay, MAX_DUMS_PER_DOSSIER } from "@/lib/reference";
import { formatMAD } from "@/lib/invoicing";
import { formatDate } from "@/lib/utils";
import { LiquidationForm, type DUM } from "@/components/dossier/dum-liquidation-form";
import { CellLink } from "@/components/ui/clickable-row";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

const fmt = (n: number | null) => (n == null ? "—" : formatMAD(n));

export function DUMsPanel({
  dossierId,
  dums,
  canCreate,
  canEditNumber,
}: {
  dossierId: string;
  dums: DUM[];
  canCreate: boolean;
  canEditNumber: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingDum, setEditingDum] = useState<DUM | null>(null);
  useEscapeClose(!!editingDum, () => setEditingDum(null));
  const [pending, start] = useTransition();
  const [number, setNumber] = useState("");
  const [bureau, setBureau] = useState("");
  const [regime, setRegime] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [customsValue, setCustomsValue] = useState("");
  const [estimatedDuties, setEstimatedDuties] = useState("");
  const [articleCount, setArticleCount] = useState("");

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
          <span className="ml-2 text-[12px] font-normal text-[var(--color-fg-3)] tnum">
            {dums.length}
          </span>
        </CardTitle>
        {canCreate && !atMax && (
          <Button size="sm" variant="soft" onClick={() => setOpen((o) => !o)}>
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
            <Combobox
              id="dumregime"
              items={CUSTOMS_REGIME_GROUPS.flatMap((g) =>
                g.items.map((r) => ({
                  id: r.code,
                  label: `${r.code} — ${r.label}`,
                  sublabel: g.group,
                })),
              )}
              value={regime}
              onChange={(v) => setRegime(v)}
              placeholder="— Sélectionner —"
              searchPlaceholder="Rechercher un régime (code ou libellé)…"
              emptyText="Aucun régime trouvé"
            />
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
        {dums.map((d) => (
            <div key={d.id} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CellLink newTab href={`/dums/${d.id}`} className="font-mono text-[13px] font-medium text-[var(--color-fg)]">
                      {d.number}
                    </CellLink>
                    {d.regime && (
                      <Badge tone="neutral" title={regimeDisplay(d.regime)}>{d.regime}</Badge>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                    {d.bureau ?? "Bureau ?"} • enregistré le {formatDate(d.registeredAt)}
                  </div>
                </div>
                <DumStatusBadge status={d.status} />
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => setEditingDum(d)}
                    aria-label="Modifier la DUM"
                    title="Modifier la DUM"
                    className={buttonVariants({ variant: "soft", size: "icon" })}
                  >
                    <Pencil />
                  </button>
                )}
              </div>
              {(d.customsValue != null ||
                d.estimatedDuties != null ||
                d.liquidatedDuties != null ||
                d.receiptNumber ||
                d.paidAt ||
                d.articleCount != null) && (
                <dl className="mt-2.5 ml-7 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[12px]">
                  <Field label="Valeur en douane" value={fmt(d.customsValue)} />
                  <Field label="Nombre d'articles" value={d.articleCount != null ? String(d.articleCount) : "—"} />
                  <Field label="Droits estimés" value={fmt(d.estimatedDuties)} />
                  <Field label="Droits liquidés" value={fmt(d.liquidatedDuties)} strong />
                  <Field label="N° quittance" value={d.receiptNumber || "—"} />
                  <Field label="Payé le" value={d.paidAt ? formatDate(d.paidAt) : "—"} />
                </dl>
              )}
            </div>
        ))}
        {canCreate && atMax && (
          <div className="px-5 py-2.5 text-[12px] text-[var(--color-fg-3)] bg-[var(--color-surface-2)]">
            Maximum {MAX_DUMS_PER_DOSSIER} DUM par dossier atteint (un dossier peut cumuler 2 régimes).
          </div>
        )}
      </div>

      {/* Édition DUM en popup : on reste dans le dossier (pas de navigation). */}
      {editingDum &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 sm:p-6"
            onMouseDown={backdropDismiss(() => setEditingDum(null))}
          >
            <div
              className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => setEditingDum(null)}
                aria-label="Fermer"
                title="Fermer"
                className="absolute right-3 top-3 z-10 size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
              <LiquidationForm
                dossierId={dossierId}
                dum={editingDum}
                canEditNumber={canEditNumber}
                onDone={() => {
                  setEditingDum(null);
                  router.refresh();
                }}
                onCancel={() => setEditingDum(null)}
              />
            </div>
          </div>,
          document.body,
        )}
    </Card>
  );
}

