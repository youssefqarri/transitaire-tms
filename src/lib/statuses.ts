import { DossierStatus, DUMStatus, DocumentCategory } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<DossierStatus, string> = {
  OUVERTURE: "Ouverture",
  RECEPTIONNE: "Réceptionné",
  DOCUMENTS_MANQUANTS: "Documents manquants",
  DOCUMENTS_RECUS: "Documents reçus",
  BON_A_DELIVRER_RECU: "BAD reçu",
  DECLARATION_EN_COURS: "Déclaration en cours",
  VALIDATION_DOUANE: "Validation douane",
  VISITE: "Visite",
  CONFORME: "Conforme",
  BUREAU_VALEUR: "Bureau de valeur",
  DEMANDE_DOCUMENTS: "Demande documents",
  LIQUIDE: "Liquidé",
  BON_A_ENLEVER_RESERVE: "BAE sous réserve",
  VALIDATION_MCA: "Validation MCA",
  BON_A_ENLEVER_DEFINITIF: "BAE définitif",
  CLOTURE: "Clôturé",
  ANNULE: "Annulé",
};

// ordre logique du workflow (utilisé pour la timeline + progression)
export const STATUS_ORDER: DossierStatus[] = [
  "OUVERTURE",
  "RECEPTIONNE",
  "DOCUMENTS_MANQUANTS",
  "DOCUMENTS_RECUS",
  "BON_A_DELIVRER_RECU",
  "DECLARATION_EN_COURS",
  "VALIDATION_DOUANE",
  "VISITE",
  "CONFORME",
  "BUREAU_VALEUR",
  "DEMANDE_DOCUMENTS",
  "LIQUIDE",
  "BON_A_ENLEVER_RESERVE",
  "VALIDATION_MCA",
  "BON_A_ENLEVER_DEFINITIF",
  "CLOTURE",
];

export const STATUS_TONE: Record<DossierStatus, "neutral" | "warn" | "info" | "ok" | "danger"> = {
  OUVERTURE: "neutral",
  RECEPTIONNE: "info",
  DOCUMENTS_MANQUANTS: "warn",
  DOCUMENTS_RECUS: "info",
  BON_A_DELIVRER_RECU: "info",
  DECLARATION_EN_COURS: "info",
  VALIDATION_DOUANE: "info",
  VISITE: "warn",
  CONFORME: "ok",
  BUREAU_VALEUR: "warn",
  DEMANDE_DOCUMENTS: "warn",
  LIQUIDE: "info",
  BON_A_ENLEVER_RESERVE: "info",
  VALIDATION_MCA: "info",
  BON_A_ENLEVER_DEFINITIF: "ok",
  CLOTURE: "ok",
  ANNULE: "danger",
};

export const DUM_STATUS_LABELS: Record<DUMStatus, string> = {
  DRAFT: "Brouillon",
  ENREGISTRE: "Enregistré BADR",
  VALIDE: "Validé",
  LIQUIDE: "Liquidé",
  CLOTURE: "Clôturé",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FACTURE_COMMERCIALE: "Facture commerciale",
  COLISAGE: "Colisage",
  FACTURE_FRET: "Facture de fret",
  CONNAISSEMENT: "Connaissement (BL)",
  ENGAGEMENT_IMPORTATION: "Engagement d'importation",
  BON_A_DELIVRER: "Bon à délivrer",
  CERTIFICAT_ORIGINE: "Certificat d'origine",
  ASSURANCE: "Assurance",
  LICENCE: "Licence",
  CERTIFICAT_SANITAIRE: "Certificat sanitaire",
  CERTIFICAT_CONFORMITE: "Certificat de conformité",
  FICHE_LIQUIDATION: "Fiche de liquidation",
  TICKET_PAIEMENT: "Ticket de paiement",
  BON_A_ENLEVER: "Bon à enlever",
  AUTRE: "Autre",
};

// documents requis selon mode de paiement
export function requiredDocuments(paymentMode: "WITH_PAYMENT" | "WITHOUT_PAYMENT"): DocumentCategory[] {
  const base: DocumentCategory[] = [
    "FACTURE_COMMERCIALE",
    "COLISAGE",
    "FACTURE_FRET",
    "CONNAISSEMENT",
    "BON_A_DELIVRER",
  ];
  if (paymentMode === "WITH_PAYMENT") base.splice(4, 0, "ENGAGEMENT_IMPORTATION");
  return base;
}
