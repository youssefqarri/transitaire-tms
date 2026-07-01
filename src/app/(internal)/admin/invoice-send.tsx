"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result = { email: boolean; whatsapp: boolean; notif: boolean; errors: string[]; ok: boolean };

function summarize(r: Result): string {
  const ok = [r.email && "email", r.whatsapp && "WhatsApp", r.notif && "notification"].filter(Boolean);
  return ok.length ? ok.join(", ") : "aucun canal";
}

// Envoi initial + relance manuelle d'une facture d'abonnement (email + WhatsApp + notif).
export function InvoiceSendButtons({ invoiceId, unpaid }: { invoiceId: string; unpaid: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(reminder: boolean) {
    start(async () => {
      const res = await fetch(
        `/api/admin/subscription-invoices/${invoiceId}/send${reminder ? "?reminder=1" : ""}`,
        { method: "POST" },
      );
      const data: Result = await res
        .json()
        .catch(() => ({ email: false, whatsapp: false, notif: false, ok: false, errors: [] }));
      if (!res.ok || !data.ok) {
        toast.error(`Échec : ${data.errors?.join(" · ") || "envoi impossible"}`);
        return;
      }
      const base = reminder ? "Relance envoyée" : "Facture envoyée";
      if (data.errors?.length) toast.warning(`${base} (${summarize(data)}) — ${data.errors.join(" · ")}`);
      else toast.success(`${base} : ${summarize(data)}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => run(false)} disabled={pending} title="Envoyer la facture">
        <Send /> Envoyer
      </Button>
      {unpaid && (
        <Button variant="ghost" size="sm" onClick={() => run(true)} disabled={pending} title="Relancer">
          <Bell /> Relancer
        </Button>
      )}
    </>
  );
}
