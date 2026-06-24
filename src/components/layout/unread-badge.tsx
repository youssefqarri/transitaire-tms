"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Badge "non lu" pour les notifications.
 * - Reçoit la valeur initiale du serveur
 * - Écoute l'event "notif:read" (émis quand une notif est lue côté client)
 * - Refresh au focus de la fenêtre (revient sur la page → count à jour)
 */
export function UnreadBadge({
  initial,
  className,
}: {
  initial: number;
  className?: string;
}) {
  const [count, setCount] = useState(initial);
  const pathname = usePathname();

  // Re-sync quand la prop change (navigation interne)
  useEffect(() => {
    setCount(initial);
  }, [initial]);

  // Re-sync à chaque navigation interne : le badge vit dans le layout persistant
  // (pas re-rendu serveur en navigation douce) → sans ça il reste périmé. Refetch
  // la vraie valeur serveur à chaque changement de route.
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancel && typeof j.count === "number") setCount(j.count);
      } catch {}
    })();
    return () => {
      cancel = true;
    };
  }, [pathname]);

  // Listen for client-side "read" events
  useEffect(() => {
    function onRead(e: Event) {
      const detail = (e as CustomEvent<{ delta: number; reset?: boolean }>).detail;
      if (detail?.reset) {
        setCount(0);
      } else if (detail?.delta) {
        setCount((c) => Math.max(0, c - detail.delta));
      }
    }
    window.addEventListener("notif:read", onRead);
    return () => window.removeEventListener("notif:read", onRead);
  }, []);

  // Au focus de la fenêtre, refetch
  useEffect(() => {
    let cancel = false;
    async function refetch() {
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancel && typeof j.count === "number") setCount(j.count);
      } catch {}
    }
    function onFocus() {
      refetch();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancel = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <span
      className={
        className ??
        "bg-[var(--color-accent)] text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center tnum"
      }
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Helper à appeler depuis un Client Component pour décrémenter ou reset le badge. */
export function emitNotifRead(opts: { delta?: number; reset?: boolean }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("notif:read", { detail: opts }));
}
