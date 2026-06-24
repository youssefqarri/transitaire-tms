import { DossierStatus, DossierType, DUMStatus, DocumentCategory, TransportMode } from "@/generated/prisma/enums";

export const STATUS_LABELS: Record<DossierStatus, string> = {
  OUVERTURE: "Ouverture",
  RECEPTIONNE: "Réceptionné",
  DOCUMENTS_MANQUANTS: "Documents manquants",
  DOCUMENTS_RECUS: "Documents reçus",
  BON_A_DELIVRER_RECU: "BAD reçu",
  DECLARATION_EN_COURS: "Déclaration en cours",
  VALIDATION_DOUANE: "Validation douane",
  INSTANCE_DATE_VISITE: "Instance date de visite",
  VISITE: "Visite planifiée",
  CONFORME: "Conforme",
  BUREAU_VALEUR: "Bureau de valeur",
  DEMANDE_ACCEPTATION_VALEUR: "Demande d'acceptation de la nouvelle valeur en douane",
  DEMANDE_DOCUMENTS: "Demande documents",
  INSTANCE_FICHE_LIQUIDATION: "Instance fiche de liquidation",
  LIQUIDE: "Liquidé",
  DEMANDE_PESAGE: "Demande de pesage",
  BON_A_ENLEVER_RESERVE: "BAE sous réserve",
  MAIN_LEVEE_RESERVE_CONFORMITE: "Main levée sous réserve conformité",
  MAIN_LEVEE_RESERVE_DOCUMENTS: "Mainlevée sous réserve de production des documents",
  VALIDATION_MCA: "Validation MCA",
  BON_A_ENLEVER: "Bon à enlever",
  BON_A_ENLEVER_DEFINITIF: "BAE définitif",
  EMBARQUEMENT: "Embarquement",
  SORTIE_MARCHANDISE: "Sortie marchandise",
  LIVRAISON: "Livraison",
  FACTURATION: "Facturation",
  FACTURE: "Facturé",
  CLOTURE: "Clôturé",
  ANNULE: "Annulé",
};

// Toutes les valeurs de statut, dérivées de STATUS_LABELS — source unique pour la
// validation API (évite les listes hardcodées qui se désynchronisent à chaque ajout
// de statut, comme ça avait été le cas pour les nouveaux statuts douane).
export const DOSSIER_STATUS_VALUES = Object.keys(STATUS_LABELS) as [
  DossierStatus,
  ...DossierStatus[],
];

// ordre logique du workflow (utilisé pour la timeline + progression)
export const STATUS_ORDER: DossierStatus[] = [
  "OUVERTURE",
  "RECEPTIONNE",
  "DOCUMENTS_MANQUANTS",
  "DOCUMENTS_RECUS",
  "BON_A_DELIVRER_RECU",
  "DECLARATION_EN_COURS",
  "VALIDATION_DOUANE",
  "INSTANCE_DATE_VISITE",
  "VISITE",
  "CONFORME",
  "BUREAU_VALEUR",
  "DEMANDE_ACCEPTATION_VALEUR",
  "DEMANDE_DOCUMENTS",
  "INSTANCE_FICHE_LIQUIDATION",
  "LIQUIDE",
  "DEMANDE_PESAGE",
  "BON_A_ENLEVER_RESERVE",
  "MAIN_LEVEE_RESERVE_CONFORMITE",
  "MAIN_LEVEE_RESERVE_DOCUMENTS",
  "VALIDATION_MCA",
  "BON_A_ENLEVER",
  "BON_A_ENLEVER_DEFINITIF",
  "EMBARQUEMENT",
  "SORTIE_MARCHANDISE",
  "LIVRAISON",
  "FACTURATION",
  "FACTURE",
  "CLOTURE",
];

// Statuts propres au dédouanement à l'import (liquidation, bon à enlever, mainlevée…)
const IMPORT_ONLY_STATUSES: DossierStatus[] = [
  "BON_A_DELIVRER_RECU",
  "DEMANDE_ACCEPTATION_VALEUR",
  "INSTANCE_FICHE_LIQUIDATION",
  "LIQUIDE",
  "DEMANDE_PESAGE",
  "BON_A_ENLEVER_RESERVE",
  "MAIN_LEVEE_RESERVE_CONFORMITE",
  "MAIN_LEVEE_RESERVE_DOCUMENTS",
  "VALIDATION_MCA",
  "BON_A_ENLEVER",
  "BON_A_ENLEVER_DEFINITIF",
];
// Statuts propres à l'export (embarquement, sortie de la marchandise)
const EXPORT_ONLY_STATUSES: DossierStatus[] = ["EMBARQUEMENT", "SORTIE_MARCHANDISE"];

// Liste ordonnée des statuts pertinents selon le sens du dossier (import vs export).
// Sert à proposer les bons statuts dans l'UI (l'API reste permissive). ANNULE toujours possible.
export function statusesForType(type: DossierType): DossierStatus[] {
  const exclude = type === "EXPORT" ? IMPORT_ONLY_STATUSES : EXPORT_ONLY_STATUSES;
  return [...STATUS_ORDER.filter((s) => !exclude.includes(s)), "ANNULE"];
}

export const STATUS_TONE: Record<DossierStatus, "neutral" | "warn" | "info" | "ok" | "danger"> = {
  OUVERTURE: "neutral",
  RECEPTIONNE: "info",
  DOCUMENTS_MANQUANTS: "warn",
  DOCUMENTS_RECUS: "info",
  BON_A_DELIVRER_RECU: "info",
  DECLARATION_EN_COURS: "info",
  VALIDATION_DOUANE: "info",
  INSTANCE_DATE_VISITE: "warn",
  VISITE: "warn",
  CONFORME: "ok",
  BUREAU_VALEUR: "warn",
  DEMANDE_ACCEPTATION_VALEUR: "warn",
  DEMANDE_DOCUMENTS: "warn",
  INSTANCE_FICHE_LIQUIDATION: "warn",
  LIQUIDE: "info",
  DEMANDE_PESAGE: "warn",
  BON_A_ENLEVER_RESERVE: "info",
  MAIN_LEVEE_RESERVE_CONFORMITE: "warn",
  MAIN_LEVEE_RESERVE_DOCUMENTS: "warn",
  VALIDATION_MCA: "info",
  BON_A_ENLEVER: "info",
  BON_A_ENLEVER_DEFINITIF: "ok",
  EMBARQUEMENT: "info",
  SORTIE_MARCHANDISE: "ok",
  LIVRAISON: "info",
  FACTURATION: "info",
  FACTURE: "ok",
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

// Source unique pour la validation API des statuts DUM (évite les listes codées en dur).
export const DUM_STATUS_VALUES = Object.keys(DUM_STATUS_LABELS) as [DUMStatus, ...DUMStatus[]];

// Une couleur distincte par statut DUM (badge avec puce, comme les dossiers).
export const DUM_STATUS_TONE: Record<DUMStatus, "neutral" | "info" | "ok" | "warn" | "accent"> = {
  DRAFT: "neutral",
  ENREGISTRE: "info",
  VALIDE: "ok",
  LIQUIDE: "warn",
  CLOTURE: "accent",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FACTURE_COMMERCIALE: "Facture commerciale",
  FACTURE_ORIGINALE: "Facture originale",
  COLISAGE: "Colisage",
  FACTURE_FRET: "Facture de fret",
  CONNAISSEMENT: "Connaissement (BL)",
  LTA_ORIGINALE: "LTA originale",
  CMR: "CMR",
  DMP: "DMP",
  ENGAGEMENT_IMPORTATION: "Engagement d'importation",
  BON_A_DELIVRER: "Bon à délivrer",
  CERTIFICAT_ORIGINE: "Certificat d'origine",
  ASSURANCE: "Assurance",
  LICENCE: "Licence",
  CERTIFICAT_SANITAIRE: "Certificat sanitaire",
  CERTIFICAT_PHYTOSANITAIRE: "Certificat phytosanitaire",
  CERTIFICAT_CONFORMITE: "Certificat de conformité",
  CERTIFICAT_FRAUDE: "Certificat de fraude",
  ATTESTATION_POIDS_MESURE: "Attestation poids et mesure",
  ATTESTATION_STOCKAGE: "Attestation de stockage",
  CATALOGUE: "Catalogue",
  FICHE_LIQUIDATION: "Fiche de liquidation",
  TICKET_PAIEMENT: "Ticket de paiement",
  BON_A_ENLEVER: "Bon à enlever",
  MAIN_LEVEE_RESERVE_PAIEMENT: "Main levée sous réserve paiement",
  DEMANDE_SERVICE_MCI: "Demande service MCI",
  DEMANDE_SERVICE_PORTNET: "Demande service PortNet",
  MESSAGE_PORTNET: "Message PortNet",
  MESSAGE_DOUANE: "Message douane",
  MESSAGE_CONFORMITE: "Message conformité (MCI)",
  AUTRE: "Autre",
};

// Source unique pour la validation API des catégories de documents.
export const DOCUMENT_CATEGORY_VALUES = Object.keys(DOCUMENT_CATEGORY_LABELS) as [
  DocumentCategory,
  ...DocumentCategory[],
];

// Catégories de documents générées en interne (douane/transitaire) que le CLIENT
// ne doit PAS voir/télécharger via le portail ou l'API v1 (révèlent montants,
// références de paiement, échanges administratifs internes).
export const INTERNAL_ONLY_CATEGORIES: DocumentCategory[] = [
  "FICHE_LIQUIDATION",
  "TICKET_PAIEMENT",
  "MAIN_LEVEE_RESERVE_PAIEMENT",
  "DEMANDE_SERVICE_MCI",
  "DEMANDE_SERVICE_PORTNET",
  "MESSAGE_PORTNET",
  "MESSAGE_DOUANE",
  "MESSAGE_CONFORMITE",
];

export function isClientVisibleCategory(cat: DocumentCategory): boolean {
  return !INTERNAL_ONLY_CATEGORIES.includes(cat);
}

// Catégories qu'un CLIENT est autorisé à DÉPOSER (pièces commerciales fournies par
// l'importateur/exportateur) — exclut les documents générés par la douane/le transitaire.
export const CLIENT_UPLOADABLE_CATEGORIES: DocumentCategory[] = [
  "FACTURE_COMMERCIALE",
  "FACTURE_ORIGINALE",
  "COLISAGE",
  "FACTURE_FRET",
  "CONNAISSEMENT",
  "LTA_ORIGINALE",
  "CMR",
  "DMP",
  "ENGAGEMENT_IMPORTATION",
  "CERTIFICAT_ORIGINE",
  "ASSURANCE",
  "LICENCE",
  "CERTIFICAT_SANITAIRE",
  "CERTIFICAT_PHYTOSANITAIRE",
  "CERTIFICAT_CONFORMITE",
  "CERTIFICAT_FRAUDE",
  "ATTESTATION_POIDS_MESURE",
  "ATTESTATION_STOCKAGE",
  "CATALOGUE",
  "AUTRE",
];

export function isClientUploadableCategory(cat: DocumentCategory): boolean {
  return CLIENT_UPLOADABLE_CATEGORIES.includes(cat);
}

// Statuts avancés qui n'ont de sens qu'avec au moins une DUM enregistrée : pas de
// liquidation / bon à enlever / mainlevée sans déclaration douanière déposée.
// (Précondition « machine à états » minimale et non bloquante pour le reste.)
export const STATUSES_REQUIRING_DUM: DossierStatus[] = [
  "LIQUIDE",
  "BON_A_ENLEVER_RESERVE",
  "MAIN_LEVEE_RESERVE_CONFORMITE",
  "MAIN_LEVEE_RESERVE_DOCUMENTS",
  "VALIDATION_MCA",
  "BON_A_ENLEVER",
  "BON_A_ENLEVER_DEFINITIF",
];

export function statusRequiresDum(status: DossierStatus): boolean {
  return STATUSES_REQUIRING_DUM.includes(status);
}

// Bucket « À traiter » : dossiers nécessitant une action (documents / valeur en douane).
// Source unique partagée par le tableau de bord (compteur + lien) et le filtre /dossiers,
// pour qu'ils ne se désynchronisent jamais.
export const ACTION_REQUIRED_STATUSES: DossierStatus[] = [
  "DOCUMENTS_MANQUANTS",
  "DEMANDE_DOCUMENTS",
  "BUREAU_VALEUR",
];

// Clé réservée (pseudo-statut) passée dans ?status= pour filtrer ce bucket.
export const ACTION_REQUIRED_KEY = "A_TRAITER";
export const ACTION_REQUIRED_LABEL = "À traiter (documents · valeur)";

// Titre de transport requis selon le mode : maritime → connaissement (BL),
// aérien → LTA, routier → CMR. Par défaut (transport inconnu) : connaissement.
export function transportDocument(transport?: TransportMode | null): DocumentCategory {
  if (transport === "AERIEN") return "LTA_ORIGINALE";
  if (transport === "ROUTIER") return "CMR";
  return "CONNAISSEMENT";
}

// Libellé court du n° de titre de transport selon le mode (en-tête facture, etc.) :
// maritime → BL, aérien → LTA, routier → CMR ; inconnu → générique.
export function transportDocLabel(transport?: TransportMode | null): string {
  if (transport === "MARITIME") return "N° BL";
  if (transport === "AERIEN") return "N° LTA";
  if (transport === "ROUTIER") return "N° CMR";
  return "N° BL / LTA / CMR";
}

// documents requis selon mode de paiement + mode de transport
// (base « toujours obligatoire » selon la cliente : facture commerciale, colisage,
//  facture de fret, titre de transport, bon à délivrer, attestation de stockage ;
//  + engagement d'importation uniquement si le dossier est avec paiement)
export function requiredDocuments(
  paymentMode: "WITH_PAYMENT" | "WITHOUT_PAYMENT",
  transport?: TransportMode | null,
): DocumentCategory[] {
  const base: DocumentCategory[] = [
    "FACTURE_COMMERCIALE",
    "COLISAGE",
    "FACTURE_FRET",
    transportDocument(transport),
    "BON_A_DELIVRER",
    "ATTESTATION_STOCKAGE",
  ];
  if (paymentMode === "WITH_PAYMENT") base.splice(4, 0, "ENGAGEMENT_IMPORTATION");
  return base;
}
