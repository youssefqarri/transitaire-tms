"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { emitNotifRead } from "@/components/layout/unread-badge";

export function MarkAllRead() {
  const router = useRouter();
  const [pending, start] = useTransition();
  function go() {
    start(async () => {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      emitNotifRead({ reset: true });
      router.refresh();
    });
  }
  return (
    <Button variant="secondary" size="sm" onClick={go} loading={pending}>
      <CheckCircle2 className="size-4" /> Tout marquer comme lu
    </Button>
  );
}
