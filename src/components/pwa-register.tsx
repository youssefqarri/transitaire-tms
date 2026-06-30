"use client";

import { useEffect } from "react";

// Enregistre le service worker (requis pour l'installabilité PWA). Le SW est
// volontairement minimal (pas de cache offline) — voir public/sw.js.
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* enregistrement best-effort */
    });
  }, []);
  return null;
}
