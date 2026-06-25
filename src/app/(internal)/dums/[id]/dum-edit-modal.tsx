"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LiquidationForm, type DUM } from "@/components/dossier/dum-liquidation-form";

/**
 * Édition d'un DUM directement depuis sa page détail (modale). Réutilise le
 * même formulaire que le panneau DUMs du dossier — donc même endpoint et même
 * comportement. À l'enregistrement, on rafraîchit la page (Server Component).
 */
export function DumEditModal({
  dum,
  dossierId,
  canEditNumber,
}: {
  dum: DUM;
  dossierId: string;
  canEditNumber: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Pencil /> Modifier
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/40 animate-fade-in overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="h-12 px-5 flex items-center justify-between border-b border-[var(--color-border)]">
              <span className="text-[14px] font-medium text-[var(--color-fg)]">Modifier la DUM</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="size-7 grid place-items-center rounded-[var(--radius-sm)] text-[var(--color-fg-mute)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <LiquidationForm
              dossierId={dossierId}
              dum={dum}
              canEditNumber={canEditNumber}
              onDone={() => {
                setOpen(false);
                router.refresh();
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
