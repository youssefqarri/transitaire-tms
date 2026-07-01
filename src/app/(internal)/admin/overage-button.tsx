"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OverageButton({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function generate() {
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}/overage-invoice`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec");
        return;
      }
      toast.success(`Facture de dépassement créée : ${data.amount} MAD`);
      router.refresh();
    });
  }

  return (
    <Button variant="soft-warning" size="sm" onClick={generate} disabled={pending}>
      <FileWarning /> Facturer le dépassement
    </Button>
  );
}
