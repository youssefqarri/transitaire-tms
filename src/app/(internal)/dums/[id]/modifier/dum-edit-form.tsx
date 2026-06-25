"use client";

import { useRouter } from "next/navigation";
import { LiquidationForm, type DUM } from "@/components/dossier/dum-liquidation-form";

/** Enrobe le formulaire de liquidation pour la page d'édition dédiée du DUM :
 *  à l'enregistrement (ou l'annulation), on revient à la fiche DUM — même flux
 *  que l'édition d'un dossier (page dédiée → retour au détail). */
export function DumEditForm({
  dum,
  dossierId,
  canEditNumber,
}: {
  dum: DUM;
  dossierId: string;
  canEditNumber: boolean;
}) {
  const router = useRouter();
  const back = () => {
    router.push(`/dums/${dum.id}`);
    router.refresh();
  };
  return (
    <LiquidationForm
      dossierId={dossierId}
      dum={dum}
      canEditNumber={canEditNumber}
      onDone={back}
      onCancel={back}
    />
  );
}
