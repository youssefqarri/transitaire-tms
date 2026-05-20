"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteDossierButton({
  dossierId,
  dossierNumber,
}: {
  dossierId: string;
  dossierNumber: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onConfirm() {
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Erreur lors de la suppression");
        return;
      }
      toast.success("Dossier supprimé");
      setOpen(false);
      router.push("/dossiers");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} title="Supprimer ce dossier">
        <Trash2 /> Supprimer
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Supprimer ce dossier ?"
        description={
          <>
            Le dossier <span className="font-mono font-medium">{dossierNumber}</span> et
            toutes ses données associées (DUMs, documents, commentaires) seront
            définitivement supprimés. Cette action est irréversible.
          </>
        }
        confirmWord="SUPPRIMER"
        confirmLabel="Supprimer"
        tone="danger"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
