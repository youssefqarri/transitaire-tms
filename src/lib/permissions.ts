// ============================================================
// Système de permissions granulaires (fondation)
// ============================================================
//
// Ce fichier introduit un modèle de permissions « module:action » qui
// remplace progressivement le système rigide à 7 rôles. La fondation est
// conçue pour NE PAS changer le comportement actuel : chaque helper de
// `roles.ts` est réimplémenté pour déléguer à `ROLE_PERMISSIONS` / `can()`,
// de sorte que chaque appelant garde un comportement identique.
//
// IMPORTANT : ce fichier n'importe AUCUN type généré (@/generated/prisma).
// Le type `UserRole` est redéfini ici comme une union de littéraux afin que
// le fichier compile SANS régénération du client Prisma (la génération qui
// ajoutera Profile / permGrants / permRevokes au client est différée).

// Les 7 rôles, en littéraux purs (mêmes valeurs que l'enum Prisma UserRole).
export type UserRole =
  | "ADMIN"
  | "EXPLOITATION"
  | "DECLARANT"
  | "COMMIS_DOUANE"
  | "BUREAU"
  | "COMPTABILITE"
  | "CLIENT";

// ------------------------------------------------------------
// Catalogue complet des permissions « module:action »
// ------------------------------------------------------------
// Source : les clés demandées par la spec + toute permission impliquée par
// les helpers de roles.ts. `as const` fige les littéraux pour dériver le type.
export const PERMISSIONS = [
  // --- Dossiers ---
  "dossier:view",
  "dossier:create",
  "dossier:edit",
  "dossier:delete",
  "dossier:status",
  "dossier:close",
  "dossier:comment_internal",
  "dossier:notify_client",
  // --- DUM (déclaration unique de marchandises) ---
  "dum:view",
  "dum:create",
  "dum:edit",
  "dum:delete",
  "dum:status",
  "dum:renumber",
  // --- Documents ---
  "document:view",
  "document:upload",
  "document:delete",
  "document:request",
  // --- Facturation ---
  "invoice:view",
  "invoice:create",
  "invoice:edit",
  "invoice:send",
  "invoice:publish",
  "invoice:delete",
  "invoice:credit_note",
  // --- Tarifs ---
  "tariff:view",
  "tariff:manage",
  // --- Clients ---
  "client:view",
  "client:create",
  "client:edit",
  "client:delete",
  "client:contacts",
  // --- Fournisseurs ---
  "supplier:view",
  "supplier:manage",
  // --- E-mails ---
  "email:view_customs",
  "email:view_accounting",
  "email:manage",
  // --- Notifications ---
  "notification:view",
  // --- Modèles de message ---
  "template:manage",
  // --- Utilisateurs ---
  "user:manage",
  // --- Journal d'audit ---
  "audit:view",
  // --- Paramètres ---
  "settings:manage",
  // --- Jetons API ---
  "token:manage",
  // --- Corbeille (restauration soft-delete) ---
  "trash:restore",
] as const;

// Union de toutes les clés de permission.
export type Permission = (typeof PERMISSIONS)[number];

// ------------------------------------------------------------
// Regroupements réutilisables (dérivés des helpers de roles.ts)
// ------------------------------------------------------------

// Permissions de consultation pures — base accordée à tous les rôles internes,
// y compris le profil « consultation seule » (COMMIS_DOUANE via isReadOnly).
const VIEW_PERMS: Permission[] = [
  "dossier:view",
  "dum:view",
  "document:view",
  "client:view",
  "supplier:view",
  "notification:view",
];

// Saisie / modification des dossiers + DUM + suppression de documents.
// Source : canModifyDossier [ADMIN, EXPLOITATION, DECLARANT] et
// canCreateDUM [ADMIN, EXPLOITATION, DECLARANT].
const DOSSIER_WRITE_PERMS: Permission[] = [
  "dossier:create", // canCreateDossier [ADMIN, EXPLOITATION, DECLARANT]
  "dossier:edit", // canModifyDossier
  "dossier:delete", // canModifyDossier
  "dossier:status", // canModifyDossier (changement de statut)
  "dum:create", // canCreateDUM / canModifyDossier
  "dum:edit", // canModifyDossier
  "dum:delete", // canModifyDossier
  "dum:status", // canModifyDossier
  "dum:renumber", // canModifyDossier
  "document:delete", // canModifyDossier (gestion des pièces du dossier)
];

// Gestion du référentiel commercial.
// Source : canManageRegistry [ADMIN, EXPLOITATION, DECLARANT].
const REGISTRY_MANAGE_PERMS: Permission[] = [
  "client:create",
  "client:edit",
  "client:delete",
  "client:contacts",
  "supplier:manage",
];

// Gestion complète de la facturation + tarifs.
// Source : canManageInvoices [ADMIN, COMPTABILITE] (création/édition/encaissement).
const INVOICE_MANAGE_PERMS: Permission[] = [
  "invoice:create",
  "invoice:edit",
  "invoice:send",
  "invoice:publish",
  "invoice:delete",
  "invoice:credit_note",
  "tariff:manage",
];

// ------------------------------------------------------------
// ROLE_PERMISSIONS — la table maîtresse rôle → permissions
// ------------------------------------------------------------
// Chaque ensemble est dérivé PRÉCISÉMENT des helpers can*() de roles.ts pour
// garantir un comportement identique. La cartographie helper → permission est
// documentée dans les commentaires ci-dessous et à la définition de chaque
// regroupement ci-dessus.
//
// Récapitulatif de la cartographie des helpers :
//   isInternal               → tous les rôles sauf CLIENT (accès interne)
//   canManageUsers           [ADMIN]                          → user:manage
//   canManageRegistry        [ADMIN, EXPLOITATION, DECLARANT] → REGISTRY_MANAGE_PERMS
//   canManageInvoices        [ADMIN, COMPTABILITE]            → INVOICE_MANAGE_PERMS
//   canCreateDossier         [ADMIN, EXPLOITATION, DECLARANT] → dossier:create
//   canModifyDossier         [ADMIN, EXPLOITATION, DECLARANT] → DOSSIER_WRITE_PERMS (sans dossier:create déjà inclus)
//   canCloseDossier          [ADMIN, DECLARANT, BUREAU]       → dossier:close
//   canCreateDUM             [ADMIN, EXPLOITATION, DECLARANT] → dum:create (inclus dans DOSSIER_WRITE_PERMS)
//   canViewAccountingEmails  [ADMIN, COMPTABILITE]            → email:view_accounting
//   canViewCustomsEmails     [ADMIN, DECLARANT, BUREAU]       → email:view_customs
//   isReadOnly               COMMIS_DOUANE                    → uniquement VIEW_PERMS
//   canViewClients           internal && !COMMIS_DOUANE       → client:view
//   canViewSuppliers         internal && !COMMIS_DOUANE       → supplier:view
//   canViewInvoices          [ADMIN, COMPTABILITE]            → invoice:view
//   canViewEmails            [ADMIN, EXPLOITATION, DECLARANT, BUREAU, COMPTABILITE] → email:manage
//   canViewNotifications     [ADMIN, EXPLOITATION, DECLARANT, BUREAU, COMPTABILITE] → notification:view
//   canUploadDocument        [ADMIN, EXPLOITATION, DECLARANT, BUREAU] → document:upload, document:request
//   canNotifyClient          [ADMIN, EXPLOITATION, DECLARANT] → dossier:notify_client
//
// Permissions transverses internes réservées à l'ADMIN (gouvernance) :
//   template:manage, audit:view, settings:manage, token:manage, trash:restore
//   (aucun helper dédié dans roles.ts ; ADMIN reçoit toutes les permissions internes).

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // ADMIN : toutes les permissions internes (super-utilisateur du cabinet).
  ADMIN: [...PERMISSIONS],

  // EXPLOITATION : consultation + saisie dossiers/DUM + référentiel + upload
  // documents + notification client. Pas de facturation, pas d'e-mails douane,
  // pas de clôture, pas d'administration.
  EXPLOITATION: [
    ...VIEW_PERMS,
    ...DOSSIER_WRITE_PERMS,
    ...REGISTRY_MANAGE_PERMS,
    "document:upload", // canUploadDocument
    "document:request", // canUploadDocument
    "dossier:notify_client", // canNotifyClient
    "email:manage", // canViewEmails (accès e-mails interne)
  ],

  // DECLARANT : mêmes droits qu'EXPLOITATION + clôture de dossier +
  // consultation des e-mails douane. (Comme Exploitation sauf facturation.)
  DECLARANT: [
    ...VIEW_PERMS,
    ...DOSSIER_WRITE_PERMS,
    ...REGISTRY_MANAGE_PERMS,
    "document:upload", // canUploadDocument
    "document:request", // canUploadDocument
    "dossier:notify_client", // canNotifyClient
    "dossier:close", // canCloseDossier
    "email:manage", // canViewEmails
    "email:view_customs", // canViewCustomsEmails
  ],

  // COMMIS_DOUANE : consultation seule (isReadOnly). Aucun droit d'écriture
  // ni d'accès e-mails, mais — par cohérence avec canViewClients/Suppliers
  // qui excluent COMMIS_DOUANE — il n'obtient PAS client:view/supplier:view.
  // Voir le retrait ci-dessous.
  COMMIS_DOUANE: [
    "dossier:view",
    "dum:view",
    "document:view",
    // NB : pas de client:view / supplier:view / notification:view
    // (canViewClients & canViewSuppliers excluent explicitement COMMIS_DOUANE,
    //  canViewNotifications ne l'inclut pas).
  ],

  // BUREAU : consultation + upload documents + clôture + e-mails (interne +
  // douane). Pas de saisie dossier/DUM, pas de référentiel, pas de facturation.
  BUREAU: [
    ...VIEW_PERMS,
    "document:upload", // canUploadDocument
    "document:request", // canUploadDocument
    "dossier:close", // canCloseDossier
    "email:manage", // canViewEmails
    "email:view_customs", // canViewCustomsEmails
  ],

  // COMPTABILITE : consultation + facturation complète + e-mails (interne +
  // comptabilité). Pas de saisie dossier/DUM, pas de référentiel.
  COMPTABILITE: [
    ...VIEW_PERMS,
    "invoice:view", // canViewInvoices
    ...INVOICE_MANAGE_PERMS, // canManageInvoices (+ tariff:manage)
    "email:manage", // canViewEmails
    "email:view_accounting", // canViewAccountingEmails
  ],

  // CLIENT : portail externe — aucune permission interne pour la fondation.
  // (Le portail client est géré par une logique d'accès dédiée, hors de ce
  //  modèle de permissions internes ; isInternal(CLIENT) === false.)
  CLIENT: [],
};

// ------------------------------------------------------------
// Forme « utilisateur » minimale pour l'évaluation des permissions
// ------------------------------------------------------------
// Type PLAT volontairement découplé du modèle Prisma User, pour que ce fichier
// reste compilable sans régénération du client.
export type PermissionUser = {
  role: UserRole;
  /** Permissions héritées d'un (ou plusieurs) profil(s) attaché(s). */
  profilePermissions?: string[];
  /** Permissions accordées individuellement (override additif). */
  permGrants?: string[];
  /** Permissions retirées individuellement (override soustractif, priorité max). */
  permRevokes?: string[];
};

// ------------------------------------------------------------
// can() — l'évaluateur de permission unique
// ------------------------------------------------------------
// Construit l'ensemble effectif :
//   base(rôle) ∪ profilePermissions ∪ permGrants  puis  − permRevokes
// Les retraits (permRevokes) ont la priorité la plus haute.
export function can(user: PermissionUser, permission: Permission): boolean {
  const effective = new Set<string>(ROLE_PERMISSIONS[user.role] ?? []);

  for (const p of user.profilePermissions ?? []) effective.add(p);
  for (const p of user.permGrants ?? []) effective.add(p);
  for (const p of user.permRevokes ?? []) effective.delete(p);

  return effective.has(permission);
}
