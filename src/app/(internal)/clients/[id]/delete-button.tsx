"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteClientButton({
  clientId,
  clientName,
  hasDossiers,
}: {
  clientId: string;
  clientName: string;
  hasDossiers: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onConfirm() {
    start(async () => {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Erreur lors de la suppression");
        return;
      }
      toast.success("Client supprimé");
      setOpen(false);
      router.push("/clients");
      router.refresh();
    });
  }

  return (
    <>
      {/* Le <span> capte le survol même quand le bouton est désactivé
          (un <button disabled> ne déclenche pas l'infobulle). */}
      <span
        className="inline-block"
        title={
          hasDossiers
            ? "Suppression impossible : ce client a encore des dossiers. Supprimez d'abord tous ses dossiers (ils iront à la corbeille) pour pouvoir le supprimer."
            : undefined
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={hasDossiers}
        >
          <Trash2 /> Supprimer
        </Button>
      </span>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Supprimer ce client ?"
        description={
          <>
            Le client <span className="font-medium">{clientName}</span> sera
            définitivement supprimé. Cette action est irréversible.
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
