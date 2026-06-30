// Service worker MINIMAL — présent uniquement pour rendre l'app installable (PWA).
// Pas de cache offline : un TMS sert des données vivantes, un cache agressif
// risquerait d'afficher des dossiers/factures périmés. Le fetch est laissé au
// réseau (pass-through). L'offline ciblé + Web Push viendront séparément.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler fetch pass-through (nécessaire pour le critère d'installabilité).
self.addEventListener("fetch", () => {
  // réseau par défaut — aucune mise en cache
});
