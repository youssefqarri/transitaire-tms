"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function InvoiceNumberForm({ current }: { current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim().toUpperCase();
    let invoiceSeqYear: number | null = null;
    let invoiceSeqFloor: number | null = null;
    if (v) {
      const m = /^FA(\d{2})(\d+)$/.exec(v);
      if (!m) {
        toast.error("Format attendu : FA + année (2 chiffres) + numéro, ex. FA261242");
        return;
      }
      invoiceSeqYear = 2000 + parseInt(m[1], 10);
      invoiceSeqFloor = parseInt(m[2], 10);
    }
    start(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceSeqYear, invoiceSeqFloor }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'enregistrement");
        return;
      }
      toast.success(v ? `Prochaine facture : ${v}` : "Réglage effacé (numérotation auto)");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nextnum">Prochain numéro de facture</Label>
        <Input
          id="nextnum"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ex. FA261242"
          className="font-mono"
        />
        <p className="text-[11.5px] text-[var(--color-fg-3)]">
          Laisser vide pour une numérotation 100 % automatique. Sinon, l&apos;outil démarre à
          ce numéro et n&apos;en redescend jamais.
        </p>
      </div>
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </form>
  );
}
