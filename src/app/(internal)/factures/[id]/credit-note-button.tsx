"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreditNoteButton({
  invoiceId,
  suggestedAmount,
}: {
  invoiceId: string;
  suggestedAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState(suggestedAmount > 0 ? suggestedAmount.toFixed(2) : "");
  const [reason, setReason] = useState("");

  function submit() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Montant invalide");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/credit-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(`Avoir ${data.number} créé`);
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button variant="soft-warning" size="sm" onClick={() => setOpen((o) => !o)}>
        <Receipt /> Avoir
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[300px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.15)] p-4 z-30 animate-fade-in">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cn-amount">Montant de l&apos;avoir (MAD)</Label>
              <Input
                id="cn-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cn-reason">Motif (optionnel)</Label>
              <Textarea
                id="cn-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison de l'avoir…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={submit} disabled={pending}>
                {pending ? "Création…" : "Créer l'avoir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
