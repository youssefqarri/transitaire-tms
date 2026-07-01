"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceMarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function markPaid() {
    start(async () => {
      const res = await fetch(`/api/admin/subscription-invoices/${invoiceId}`, {
        method: "PATCH",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec");
        return;
      }
      toast.success("Facture marquée payée");
      router.refresh();
    });
  }

  return (
    <Button variant="soft-success" size="sm" onClick={markPaid} disabled={pending}>
      <Check /> Marquer payé
    </Button>
  );
}
