"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Activer / désactiver un compte. Masqué sur son propre compte. */
export function UserActiveToggle({
  userId,
  active,
  self,
}: {
  userId: string;
  active: boolean;
  self: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (self) return null;

  function toggle() {
    if (
      active &&
      !confirm(
        "Désactiver ce compte ? La personne ne pourra plus se connecter et ses sessions en cours seront immédiatement fermées.",
      )
    )
      return;
    start(async () => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Erreur");
        return;
      }
      toast.success(active ? "Compte désactivé" : "Compte réactivé");
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={pending}
      className={active ? "text-[var(--color-danger)]" : ""}
    >
      {active ? "Désactiver" : "Réactiver"}
    </Button>
  );
}
