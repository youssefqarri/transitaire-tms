"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Génère une facture d'abonnement APRÈS confirmation du contenu (libellé, période,
// montant HT, TVA, échéance) avec aperçu du TTC.
export function GenerateInvoiceButton({
  orgId,
  planName,
  planPrice,
}: {
  orgId: string;
  planName: string | null;
  planPrice: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  useEscapeClose(open, () => setOpen(false), !pending);

  const now = new Date();
  const [label, setLabel] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [amount, setAmount] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const [dueAt, setDueAt] = useState("");

  function openDialog() {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const due = new Date(now.getTime() + 15 * 86400000);
    setLabel(`Abonnement ${planName ?? ""} — ${MONTHS[now.getMonth()]} ${now.getFullYear()}`.replace("  ", " ").trim());
    setPeriodStart(iso(start));
    setPeriodEnd(iso(end));
    setAmount(planPrice != null ? String(planPrice) : "");
    setVatRate("20");
    setDueAt(iso(due));
    setOpen(true);
  }

  const ht = Number(amount) || 0;
  const vat = Math.round(((ht * (Number(vatRate) || 0)) / 100) * 100) / 100;
  const ttc = Math.round((ht + vat) * 100) / 100;

  function submit() {
    if (!(ht > 0)) return toast.error("Montant HT invalide");
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || undefined,
          amount: ht,
          vatRate: Number(vatRate) || 0,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          dueAt: dueAt || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec de la génération");
        return;
      }
      toast.success(`Facture ${data.number ?? ""} générée`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <FilePlus /> Générer une facture
      </Button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 sm:p-6"
            onMouseDown={backdropDismiss(() => !pending && setOpen(false))}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div className="text-[14px] font-semibold">Générer une facture d&apos;abonnement</div>
                <button
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center hover:bg-[var(--color-surface-2)] text-[var(--color-fg-mute)]"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="label">Libellé / objet</Label>
                  <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Période — du</Label>
                    <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>au</Label>
                    <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Montant HT (MAD)</Label>
                    <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>TVA (%)</Label>
                    <Input type="number" min={0} max={100} step="0.1" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Échéance</Label>
                    <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                  </div>
                </div>

                {/* Aperçu des totaux */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-3 space-y-1 text-[13px]">
                  <Row label="Total HT" value={`${fmt(ht)} MAD`} />
                  <Row label={`TVA ${Number(vatRate) || 0} %`} value={`${fmt(vat)} MAD`} />
                  <div className="border-t border-[var(--color-border)] my-1" />
                  <Row label="Total TTC" value={`${fmt(ttc)} MAD`} strong />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={submit} disabled={pending}>
                  <FilePlus /> {pending ? "Génération…" : "Générer la facture"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold text-[var(--color-fg)]" : "text-[var(--color-fg-3)]"}>{label}</span>
      <span className={`tnum ${strong ? "font-semibold text-[var(--color-fg)]" : "text-[var(--color-fg)]"}`}>
        {value}
      </span>
    </div>
  );
}
