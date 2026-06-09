"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RestoreButton({ type, id }: { type: string; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await fetch("/api/trash/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, id }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(d.error || "Échec de la restauration");
            return;
          }
          toast.success("Élément restauré");
          router.refresh();
        })
      }
    >
      <RotateCcw /> {pending ? "Restauration…" : "Restaurer"}
    </Button>
  );
}
