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

// Régimes douaniers — codification officielle de l'ADII (Administration des
// Douanes et Impôts Indirects), Circulaire n° 6047/312 du 20 mai 2020. Liste
// complète, groupée par catégorie pour la saisie. Le champ `regime` d'une DUM
// stocke le CODE (ex. "010"). Reste un `z.string()` côté API (pas d'enum figé,
// cf. souplesse sans migration) — le select guide vers les codes valides.
export const CUSTOMS_REGIME_GROUPS: {
  group: string;
  items: readonly { code: string; label: string }[];
}[] = [
  {
    group: "Régimes simples — Importation",
    items: [{ code: "010", label: "Mise à la consommation directe" }],
  },
  {
    group: "Régimes simples — Exportation",
    items: [
      { code: "060", label: "Exportation en simple sortie" },
      { code: "061", label: "Exportation dans le cadre du SGP" },
      { code: "680", label: "Exportation définitive en régularisation d'ETPP ou d'ET" },
      { code: "069", label: "Exportation dans le cadre du drawback" },
    ],
  },
  {
    group: "Régimes économiques (RED) — Importations",
    items: [
      { code: "020", label: "Importation en compensation d'exportation préalable, avec paiement" },
      { code: "021", label: "Importation en compensation d'exportation préalable, sans paiement" },
      { code: "022", label: "Admission temporaire pour perfectionnement actif (ATPA), avec paiement" },
      { code: "023", label: "ATPA sans paiement" },
      { code: "241", label: "Transformation sous douane — importation fractionnée" },
      { code: "242", label: "Transformation sous douane — papier d'édition" },
      { code: "243", label: "Transformation sous douane — autres" },
      { code: "300", label: "Admission temporaire (AT) — matériel de recherche hydrocarbure" },
      { code: "301", label: "AT de matériel soumis à redevances trimestrielles" },
      { code: "302", label: "AT de matériel non soumis à redevances trimestrielles" },
      { code: "303", label: "AT de marchandises réexportées pour opération de commerce triangulaire" },
      { code: "310", label: "AT de films et enregistrements loués ou prêtés" },
      { code: "311", label: "AT d'emballages et contenants importés vides" },
      { code: "312", label: "AT d'emballages et contenants importés pleins" },
      { code: "321", label: "AT de marchandises (délai 6 mois)" },
      { code: "322", label: "AT de marchandises (délai 2 ans)" },
      { code: "323", label: "Importation anticipée dans le cadre de l'échange standard" },
      { code: "331", label: "AT des véhicules" },
      { code: "332", label: "Autres AT" },
      { code: "035", label: "Entrepôt public" },
      { code: "036", label: "Entrepôt privé banal" },
      { code: "037", label: "Entrepôt privé particulier (EPP)" },
      { code: "381", label: "Entrepôt industriel franc (EIF) — importation directe de matières premières" },
      { code: "385", label: "EIF — importation directe de matériel" },
    ],
  },
  {
    group: "Régimes économiques (RED) — Cessions et transferts",
    items: [
      { code: "382", label: "EIF en suite d'EIF" },
      { code: "383", label: "EIF en suite d'ATPA" },
      { code: "384", label: "EIF en suite d'AT" },
      { code: "386", label: "EIF en suite d'EPP" },
      { code: "080", label: "Mutation et entrée en entrepôt" },
      { code: "081", label: "Entrepôt en suite de régimes économiques" },
      { code: "817", label: "Cession/entrée en entrepôt d'exportation en suite de régimes économiques" },
      { code: "082", label: "ATPA en suite de régimes économiques" },
      { code: "820", label: "Transformation sous douane en suite d'ATPA" },
      { code: "821", label: "Transformation sous douane en suite d'AT" },
      { code: "822", label: "Transformation sous douane en suite d'EPP" },
      { code: "083", label: "AT en suite de régimes économiques" },
      { code: "084", label: "Cession / export préalable" },
      { code: "849", label: "Cession exportation préalable des véhicules automobiles" },
    ],
  },
  {
    group: "Régimes économiques (RED) — Mises à la consommation (MAC)",
    items: [
      { code: "040", label: "MAC en suite d'ATPA" },
      { code: "430", label: "MAC en suite de transformation sous douane" },
      { code: "044", label: "MAC en suite d'AT" },
      { code: "046", label: "MAC en suite d'entrepôt public" },
      { code: "047", label: "MAC en suite d'entrepôt privé particulier" },
      { code: "048", label: "MAC en suite d'entrepôt industriel franc" },
    ],
  },
  {
    group: "Régimes économiques (RED) — Exportations",
    items: [
      { code: "070", label: "Exportation en suite d'ATPA, avec paiement" },
      { code: "700", label: "Exportation en suite de transformation sous douane" },
      { code: "072", label: "Exportation en suite d'ATPA, sans paiement" },
      { code: "074", label: "Exportation en suite d'AT" },
      { code: "075", label: "Exportation en suite d'EPP" },
      { code: "751", label: "Exportation en suite d'EIF" },
      { code: "752", label: "Exportation en suite d'entrepôt d'exportation" },
      { code: "077", label: "ETPP de marchandises marocaines ou nationalisées" },
      { code: "770", label: "ETPP avec échange standard" },
      { code: "771", label: "ETPP en suite d'ATPA" },
      { code: "772", label: "Exportation en suite d'importation anticipée (échange standard)" },
      { code: "078", label: "Exportation temporaire" },
      { code: "079", label: "Exportation préalable" },
    ],
  },
  {
    group: "Régimes de transit",
    items: [
      { code: "085", label: "Transit à l'import" },
      { code: "086", label: "Transit à l'export" },
    ],
  },
  {
    group: "Régimes de réimportation",
    items: [
      { code: "051", label: "Réimportation en suite d'ETPP" },
      { code: "510", label: "Réimportation en suite d'ETPP avec échange standard" },
      { code: "511", label: "Réimportation dans le cadre ETPP en suite d'ATPA" },
      { code: "052", label: "Réimportation en suite d'ET" },
      { code: "053", label: "Réimportation en suite de drawback" },
      { code: "054", label: "Réimportation en suite d'autres exportations" },
      { code: "055", label: "ATPA de marchandises réimportées pour retouches" },
      { code: "056", label: "AT de marchandises réimportées" },
    ],
  },
  {
    group: "Marchandises locales soumises à TIC",
    items: [
      { code: "087", label: "Transit de marchandises locales" },
      { code: "090", label: "Entrepôt de produits pétroliers" },
      { code: "092", label: "Entrepôt d'autres produits" },
      { code: "093", label: "ATPA de marchandises soumises à TIC" },
      { code: "094", label: "MAC en suite d'entrepôt produits pétroliers" },
      { code: "095", label: "MAC en suite de sortie raffinerie" },
      { code: "097", label: "MAC en suite d'entrepôt autres marchandises" },
      { code: "098", label: "Essai et marquage des objets en platine, or ou argent" },
      { code: "099", label: "MAC d'autres marchandises soumises à TIC" },
    ],
  },
  {
    group: "Zones franches",
    items: [
      { code: "050", label: "MAC de marchandises en provenance des zones franches" },
      { code: "221", label: "ATPA avec paiement en provenance des zones franches" },
      { code: "231", label: "ATPA sans paiement en provenance des zones franches" },
      { code: "681", label: "Exportation définitive en régularisation d'ETPP ou d'ET vers les zones franches" },
      { code: "682", label: "Exportation vers l'étranger en suite d'exportation via les zones franches logistiques" },
      { code: "761", label: "Exportation simple vers les zones franches" },
      { code: "762", label: "Exportation en suite d'ATPA vers les zones franches" },
      { code: "763", label: "Exportation en suite d'AT vers les zones franches" },
      { code: "764", label: "Exportation en suite d'entrepôt vers les zones franches" },
      { code: "765", label: "Exportation temporaire (ET) vers les zones franches" },
      { code: "766", label: "Exportation pour perfectionnement passif (ETPP) vers les zones franches" },
      { code: "767", label: "Exportation en suite de transformation sous douane vers les zones franches" },
      { code: "768", label: "Exportation en suite de l'EIF vers les zones franches" },
      { code: "769", label: "Exportation via les zones franches logistiques" },
      { code: "855", label: "Transit à l'import de l'étranger à destination des zones franches" },
      { code: "856", label: "Transit entre zones franches (autres que portuaires et aéroportuaires)" },
      { code: "866", label: "Transit à l'export vers l'étranger à partir des zones franches" },
    ],
  },
  {
    group: "Divers",
    items: [
      { code: "002", label: "Transbordement sur l'étranger" },
      { code: "003", label: "Transport maritime intérieur" },
      { code: "004", label: "Déclaration occasionnelle import" },
      { code: "005", label: "Déclaration occasionnelle export" },
      { code: "006", label: "Déclaration provisoire import simple" },
      { code: "007", label: "Déclaration provisoire import sous régimes économiques" },
      { code: "008", label: "Déclaration d'admission temporaire de conteneurs" },
      { code: "009", label: "Déclaration d'admission temporaire de véhicules à usage commercial" },
      { code: "800", label: "Exportation temporaire de conteneurs (D 21)" },
      { code: "900", label: "Exportation temporaire de véhicules à usage commercial (D 20)" },
    ],
  },
];

// Liste plate (tous les régimes) + map code → libellé pour l'affichage.
export const CUSTOMS_REGIMES = CUSTOMS_REGIME_GROUPS.flatMap((g) => g.items);
const REGIME_LABELS: Record<string, string> = Object.fromEntries(
  CUSTOMS_REGIMES.map((r) => [r.code, r.label]),
);

/** Affichage « 010 — Mise à la consommation directe ». Repli sur la valeur brute
 *  pour les anciennes DUM saisies en texte libre (avant la codification). */
export function regimeDisplay(code: string | null | undefined): string {
  if (!code) return "—";
  const label = REGIME_LABELS[code];
  return label ? `${code} — ${label}` : code;
}

// Nombre maximum de DUM par dossier (régimes multiples : ex. une partie en mise à
// la consommation, une partie sous régime économique).
export const MAX_DUMS_PER_DOSSIER = 2;
