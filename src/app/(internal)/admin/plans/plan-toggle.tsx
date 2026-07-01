"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PlanActiveToggle({ planId, active }: { planId: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        toast.error("Échec");
        return;
      }
      toast.success(active ? "Plan désactivé" : "Plan activé");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer disabled:opacity-50",
        active
          ? "border-[var(--color-success)] text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
          : "border-[var(--color-border-2)] text-[var(--color-fg-mute)] hover:border-[var(--color-fg-mute)]",
      )}
      title={active ? "Cliquer pour désactiver" : "Cliquer pour activer"}
    >
      {active ? "Actif" : "Inactif"}
    </button>
  );
}
