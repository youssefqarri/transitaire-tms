import type { MetadataRoute } from "next";

// PWA : rend l'app installable (« ajouter à l'écran d'accueil »). Pas de cache
// offline agressif (TMS data-lourd → risque de données périmées) ; l'offline/push
// viendra séparément. Des icônes PNG carrées 192/512 « maskable » restent à ajouter
// pour un rendu d'install parfait (ne pas altérer le logo).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Escale — le transit intelligent",
    short_name: "Escale",
    description: "Gestion de transit douanier — du port à la livraison.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "fr",
    icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
