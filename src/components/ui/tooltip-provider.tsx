"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Tip = { text: string; x: number; y: number; below: boolean };

// Sources de tooltip : title (boutons-icônes, badges…), data-tooltip explicite,
// ou aria-label sur un bouton/lien (icônes accessibles sans title).
const SELECTOR =
  "[title],[data-tooltip],button[aria-label],a[aria-label],[role='button'][aria-label]";

/**
 * Tooltip global stylé, en délégation d'événements (un seul écouteur pour toute
 * l'app — aucun wrapper par élément). Lit les attributs déjà présents, supprime
 * le tooltip natif du navigateur, et affiche une bulle au design de l'app.
 */
export function TooltipProvider() {
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeEl = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function reset() {
      if (timer.current) clearTimeout(timer.current);
      const el = activeEl.current;
      if (el && el.dataset.tipStash !== undefined) {
        el.setAttribute("title", el.dataset.tipStash);
        delete el.dataset.tipStash;
      }
      activeEl.current = null;
      setTip(null);
    }

    function onOver(e: PointerEvent) {
      const path = e.target as HTMLElement | null;
      if (!path || typeof path.closest !== "function") return;
      // Toujours à l'intérieur de l'élément actif (même sur un enfant) → on garde.
      if (activeEl.current && activeEl.current.contains(path)) return;
      const el = path.closest<HTMLElement>(SELECTOR);
      if (!el) {
        if (activeEl.current) reset();
        return;
      }
      const text = (
        el.getAttribute("title") ||
        el.getAttribute("data-tooltip") ||
        el.getAttribute("aria-label") ||
        ""
      ).trim();
      if (!text) return;
      reset();
      // Supprime le tooltip natif si la source est `title` (restauré au départ).
      if (el.hasAttribute("title")) {
        el.dataset.tipStash = el.getAttribute("title") ?? "";
        el.removeAttribute("title");
      }
      activeEl.current = el;
      timer.current = setTimeout(() => {
        const r = el.getBoundingClientRect();
        const below = r.top < 40;
        const half = 130;
        const x = Math.min(
          Math.max(r.left + r.width / 2, half + 6),
          window.innerWidth - half - 6,
        );
        setTip({ text, x: Math.round(x), y: Math.round(below ? r.bottom + 6 : r.top - 6), below });
      }, 220);
    }

    function onOut(e: PointerEvent) {
      const to = e.relatedTarget as Node | null;
      if (activeEl.current && to && activeEl.current.contains(to)) return;
      reset();
    }

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    window.addEventListener("scroll", reset, true);
    window.addEventListener("pointerdown", reset, true);
    return () => {
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      window.removeEventListener("scroll", reset, true);
      window.removeEventListener("pointerdown", reset, true);
      reset();
    };
  }, []);

  if (!mounted || !tip) return null;

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        left: tip.x,
        top: tip.y,
        transform: `translate(-50%, ${tip.below ? "0" : "-100%"})`,
        zIndex: 9999,
        pointerEvents: "none",
      }}
      className={`px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--color-fg)] text-[var(--color-surface)] text-[12px] font-medium leading-snug shadow-[0_6px_20px_-6px_rgba(0,0,0,0.35)] max-w-[280px] whitespace-pre-line ${
        tip.text.includes("\n") ? "text-left" : "text-center"
      }`}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
