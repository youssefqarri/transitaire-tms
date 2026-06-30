"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OrgActiveToggle({ orgId, active }: { orgId: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await fetch(`/api/admin/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        toast.error("Échec de l'opération");
        return;
      }
      toast.success(active ? "Cabinet suspendu" : "Cabinet réactivé");
      router.refresh();
    });
  }

  return (
    <Button
      variant={active ? "soft-danger" : "soft-success"}
      size="sm"
      onClick={toggle}
      disabled={pending}
    >
      {active ? "Suspendre" : "Réactiver"}
    </Button>
  );
}
