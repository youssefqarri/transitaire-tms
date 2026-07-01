"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

const METHODS = [
  { id: "VIREMENT", label: "Virement" },
  { id: "CHEQUE", label: "Chèque" },
  { id: "ESPECES", label: "Espèces" },
  { id: "TRAITE", label: "Traite" },
  { id: "AUTRE", label: "Autre" },
];

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Enregistre un encaissement (hors-ligne) sur une facture d'abonnement. Supporte
// le paiement partiel : le montant par défaut = solde restant.
export function InvoicePaymentButton({
  invoiceId,
  amount,
  paidAmount,
}: {
  invoiceId: string;
  amount: number;
  paidAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const remaining = Math.max(0, Math.round((amount - paidAmount) * 100) / 100);

  const [value, setValue] = useState(String(remaining));
  const [method, setMethod] = useState("VIREMENT");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  useEscapeClose(open, () => setOpen(false), !pending);

  function submit() {
    const amt = Number(value);
    if (!(amt > 0)) {
      toast.error("Montant invalide");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/admin/subscription-invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method, date, reference: reference || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec");
        return;
      }
      toast.success(data.status === "PAID" ? "Facture soldée" : "Encaissement enregistré");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="soft-success" size="sm" onClick={() => setOpen(true)}>
        <Wallet /> Encaisser
      </Button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6 animate-fade-in"
            onMouseDown={backdropDismiss(() => !pending && setOpen(false))}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-sm p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-[var(--color-fg)]">
                    Enregistrer un encaissement
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] tnum">
                    Reste à encaisser : {fmt(remaining)} MAD sur {fmt(amount)} MAD
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Montant (MAD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Méthode</Label>
                  <Combobox items={METHODS} value={method} onChange={setMethod} searchable={false} />
                </div>
                <div className="space-y-1.5">
                  <Label>Référence</Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="N° chèque, virement…"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={submit} disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
