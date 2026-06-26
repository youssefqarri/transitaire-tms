import type { Metadata } from "next";

// Layout dédié à la vitrine publique (apex escale.ma) : AUCUN sidebar, AUCUNE
// auth. Le RootLayout (src/app/layout.tsx) fournit déjà <html>/<body>, les
// polices Geist et globals.css ; on n'enveloppe donc QUE le contenu marketing.
// Cette page est servie via une réécriture (rewrite) du middleware quand l'hôte
// est l'apex (escale.ma / www.escale.ma) ; l'application TMS (app.escale.ma)
// n'est jamais affectée.

export const metadata: Metadata = {
  // `absolute` court-circuite le template du RootLayout (« %s • … ») pour éviter
  // un titre dupliqué sur la vitrine.
  title: { absolute: "Escale — le transit intelligent, du port à la livraison" },
  description:
    "Escale est le logiciel des transitaires et commissionnaires en douane au Maroc : gestion des dossiers de dédouanement, déclarations DUM, documents, facturation TVA et notifications clients par e-mail et WhatsApp. Du port à la livraison, en une seule plateforme.",
  applicationName: "Escale",
  alternates: { canonical: "https://escale.ma/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: "https://escale.ma/",
    siteName: "Escale",
    title: "Escale — le transit intelligent, du port à la livraison",
    description:
      "Le logiciel de gestion pour transitaires et commissionnaires en douane au Maroc : dossiers, DUM, documents, facturation et notifications clients.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Escale — le transit intelligent, du port à la livraison",
    description:
      "Le logiciel de gestion pour transitaires et commissionnaires en douane au Maroc.",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
