import { useEffect } from "react";
import type { MouseEvent } from "react";

/**
 * Ferme un popup/modal quand on appuie sur Escape (tant qu'il est ouvert).
 * `enabled` permet de bloquer la fermeture (ex. pendant un envoi en cours).
 */
export function useEscapeClose(open: boolean, onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!open || !enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, enabled, onClose]);
}

/**
 * Handler `onMouseDown` pour le fond (backdrop) d'un modal : ne ferme QUE si
 * le clic DÉMARRE sur le fond lui-même. Évite le bug où sélectionner du texte
 * dans le modal puis relâcher la souris dehors fermait le modal (le `click`
 * « rebondissait » sur le backdrop au relâchement).
 */
export function backdropDismiss(onClose: () => void) {
  return (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };
}
