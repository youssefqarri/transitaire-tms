// Référentiels métier courts, gardés en code (et non en enum Prisma) pour pouvoir
// évoluer sans migration. Utilisés par les formulaires (listes déroulantes) et,
// si besoin, pour de la validation côté serveur.

// Organismes de contrôle de CONFORMITÉ — un seul par dossier.
export const CONTROL_ORGANISMS = [
  "Bureau Veritas",
  "SGS",
  "Applus (A+)",
  "TÜV Rheinland",
  "Intertek",
] as const;

// Services réglementaires sectoriels — un produit peut relever de plusieurs (0..N).
export const REGULATORY_SERVICES = [
  "ONSSA", // Office National de Sécurité Sanitaire des produits Alimentaires
  "ANRT", // Agence Nationale de Réglementation des Télécommunications
  "IMANOR", // Institut Marocain de Normalisation
  "DMP", // Direction du Médicament et de la Pharmacie
] as const;

// Régimes douaniers d'une DUM. La cliente traite uniquement la mise à la
// consommation (régime 10) à l'import et l'exportation — pas de régimes
// suspensifs/économiques. Liste volontairement restreinte (extensible au besoin).
export const DUM_REGIMES = [
  "Mise à la consommation",
  "Exportation",
] as const;

// Nombre maximum de DUM par dossier (régimes multiples : ex. une partie en mise à
// la consommation, une partie sous régime économique).
export const MAX_DUMS_PER_DOSSIER = 2;
