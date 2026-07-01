"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Génère la facture d'abonnement (frais du forfait) du mois courant pour le cabinet.
export function GenerateInvoiceButton({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function generate() {
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec de la génération");
        return;
      }
      toast.success(`Facture ${data.number ?? ""} générée`);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={pending}>
      <FilePlus /> {pending ? "Génération…" : "Générer une facture"}
    </Button>
  );
}
