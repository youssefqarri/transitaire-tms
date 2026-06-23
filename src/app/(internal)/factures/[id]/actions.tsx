"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatMAD } from "@/lib/invoicing";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/enums";

export function InvoiceActions({
  id,
  currentStatus,
  paidAmount,
  totalTTC,
  totalCredits,
}: {
  id: string;
  currentStatus: InvoiceStatus;
  paidAmount: number;
  totalTTC: number;
  /** Total des avoirs actifs — déduit du montant à régler et du seuil « réglée ». */
  totalCredits: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus);
  const [payAmount, setPayAmount] = useState(
    Math.max(0, totalTTC - paidAmount - totalCredits).toFixed(2),
  );
  const [method, setMethod] = useState<PaymentMethod>("VIREMENT");
  const [ref, setRef] = useState("");

  function changeStatus() {
    start(async () => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("Erreur"); return; }
      toast.success("Statut mis à jour");
      setOpen(false);
      router.refresh();
    });
  }

  function recordPayment() {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Montant invalide");
      return;
    }
    start(async () => {
      const newPaid = paidAmount + amt;
      const newStatus: InvoiceStatus =
        newPaid + totalCredits >= totalTTC ? "PAID" : "PARTIALLY_PAID";
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: newPaid,
          status: newStatus,
          paidAt: newStatus === "PAID" ? new Date().toISOString() : null,
          paymentMethod: method,
          paymentRef: ref || null,
        }),
      });
      if (!res.ok) { toast.error("Erreur"); return; }
      toast.success(newStatus === "PAID" ? "Facture réglée" : "Paiement enregistré");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        Actions <ChevronDown className="size-3.5" />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-[340px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] p-4 z-30 animate-fade-in space-y-4"
          onMouseLeave={() => setOpen(false)}
        >
          <div>
            <div className="text-[12px] font-semibold mb-2 text-[var(--color-fg)]">
              Changer le statut
            </div>
            <div className="flex gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
                {Object.entries(INVOICE_STATUS_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
              <Button size="sm" onClick={changeStatus} disabled={pending || status === currentStatus}>
                OK
              </Button>
            </div>
          </div>

          {paidAmount < totalTTC && currentStatus !== "CANCELLED" && (
            <div className="border-t border-[var(--color-border)] pt-3">
              <div className="text-[12px] font-semibold mb-2 text-[var(--color-fg)]">
                Enregistrer un paiement
              </div>
              <div className="text-[11.5px] text-[var(--color-fg-3)] mb-2">
                Reste à régler : {formatMAD(totalTTC - paidAmount)}
              </div>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="amt">Montant (MAD)</Label>
                  <Input
                    id="amt"
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="m">Mode</Label>
                  <Select id="m" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="r">Référence (optionnel)</Label>
                  <Input
                    id="r"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="N° virement, chèque, etc."
                  />
                </div>
                <Button size="sm" className="w-full" onClick={recordPayment} disabled={pending}>
                  Enregistrer le paiement
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
