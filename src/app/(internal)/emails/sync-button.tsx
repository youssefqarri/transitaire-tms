"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  function sync() {
    start(async () => {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erreur"); return; }
      toast.success(`${data.imported} email(s) importé(s), ${data.linked} rattaché(s)`);
      router.refresh();
    });
  }
  return (
    <Button size="sm" variant="outline" onClick={sync} disabled={pending}>
      <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
      Synchroniser
    </Button>
  );
}
