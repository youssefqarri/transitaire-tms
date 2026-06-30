import { UserRole } from "@/generated/prisma/enums";
import { can, type Permission } from "@/lib/permissions";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  EXPLOITATION: "Exploitation",
  DECLARANT: "Déclarant",
  COMMIS_DOUANE: "Commis en douane",
  BUREAU: "Bureau administratif",
  COMPTABILITE: "Comptabilité",
  CLIENT: "Client",
};

// Une couleur distincte par type d'utilisateur (badge de rôle).
// Les valeurs correspondent aux tons du composant Badge (ui/badge.tsx).
export const ROLE_TONE: Record<
  UserRole,
  "purple" | "info" | "ok" | "warn" | "teal" | "neutral" | "outline"
> = {
  ADMIN: "purple",
  EXPLOITATION: "info",
  DECLARANT: "ok",
  COMMIS_DOUANE: "warn",
  COMPTABILITE: "teal",
  BUREAU: "neutral",
  CLIENT: "outline",
};

// rôles internes (vs client externe)
export const INTERNAL_ROLES: UserRole[] = [
  "ADMIN",
  "EXPLOITATION",
  "DECLARANT",
  "COMMIS_DOUANE",
  "BUREAU",
  "COMPTABILITE",
];

export function isInternal(role: UserRole) {
  return INTERNAL_ROLES.includes(role);
}

// ------------------------------------------------------------
// Helpers de capacité — réimplémentés au-dessus du modèle de permissions.
// ------------------------------------------------------------
// Chaque helper conserve EXACTEMENT son nom + sa signature (role: UserRole) et
// délègue à `can()` avec une permission représentative dont l'ensemble de rôles
// (ROLE_PERMISSIONS) est strictement identique à l'ancienne liste codée en dur.
// Le comportement est donc byte-identique pour chaque appelant existant.
// On évalue sur une forme utilisateur PLATE { role } (sans profil ni override),
// de sorte que `can()` retombe sur ROLE_PERMISSIONS[role].

// Petite fabrique : transforme un rôle nu en question de permission.
function roleCan(role: UserRole, permission: Permission): boolean {
  return can({ role }, permission);
}

export function canManageUsers(role: UserRole) {
  // [ADMIN] — canManageUsers → user:manage
  return roleCan(role, "user:manage");
}

// Saisie du référentiel commercial (clients, fournisseurs, contacts) : réservée à
// Exploitation, Admin et Déclarant ; les autres rôles consultent seulement. Demande cliente.
export function canManageRegistry(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT] — canManageRegistry → client:create (REGISTRY_MANAGE_PERMS)
  return roleCan(role, "client:create");
}

// Gestion de la facturation (création/édition/encaissement) : seuls ADMIN et
// COMPTABILITE (cohérent avec l'accès page /factures).
export function canManageInvoices(role: UserRole) {
  // [ADMIN, COMPTABILITE] — canManageInvoices → invoice:create (INVOICE_MANAGE_PERMS)
  return roleCan(role, "invoice:create");
}

// Création de dossiers : Exploitation, Admin et Déclarant — le Déclarant a les mêmes
// droits que l'Exploitation, sauf la facturation (réservée Admin + Comptabilité).
// Demande cliente 2026-06-23.
export function canCreateDossier(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT] — canCreateDossier → dossier:create
  return roleCan(role, "dossier:create");
}

// Saisie / modification des dossiers : réservée à Exploitation, Admin et Déclarant ;
// les autres rôles consultent seulement (Bureau, Commis, Compta). Demande cliente.
export function canModifyDossier(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT] — canModifyDossier → dossier:edit (DOSSIER_WRITE_PERMS)
  return roleCan(role, "dossier:edit");
}

export function canCloseDossier(role: UserRole) {
  // [ADMIN, DECLARANT, BUREAU] — canCloseDossier → dossier:close
  return roleCan(role, "dossier:close");
}

// Saisie des DUM : réservée à Exploitation, Admin et Déclarant. Les autres
// consultent seulement (Bureau, Commis, Compta). Demande cliente.
export function canCreateDUM(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT] — canCreateDUM → dum:create (DOSSIER_WRITE_PERMS)
  return roleCan(role, "dum:create");
}

export function canViewAccountingEmails(role: UserRole) {
  // [ADMIN, COMPTABILITE] — canViewAccountingEmails → email:view_accounting
  return roleCan(role, "email:view_accounting");
}

export function canViewCustomsEmails(role: UserRole) {
  // COMMIS_DOUANE = consultation seulement, pas d'accès emails
  // [ADMIN, DECLARANT, BUREAU] — canViewCustomsEmails → email:view_customs
  return roleCan(role, "email:view_customs");
}

// Profil "consultation seule" — réservé COMMIS_DOUANE pour l'instant.
// Voir aussi can* ci-dessus qui doivent tous le retourner à false.
// (Prédicat de profil, pas une capacité : conservé en test de rôle direct.)
export function isReadOnly(role: UserRole) {
  return role === "COMMIS_DOUANE";
}

export function canViewClients(role: UserRole) {
  // internal && !COMMIS_DOUANE — canViewClients → client:view
  return roleCan(role, "client:view");
}

export function canViewSuppliers(role: UserRole) {
  // internal && !COMMIS_DOUANE — canViewSuppliers → supplier:view
  return roleCan(role, "supplier:view");
}

// Facturation = Comptabilité + Administrateur UNIQUEMENT — ni saisie ni
// consultation pour Exploitation, Déclarant, Commis en douane, Bureau, Client
// (exigence cliente Transit Multiservices, 19/06/2026). Cohérent avec
// canManageInvoices et FACTURATION_ACCESS (nav).
export function canViewInvoices(role: UserRole) {
  // [ADMIN, COMPTABILITE] — canViewInvoices → invoice:view
  return roleCan(role, "invoice:view");
}

export function canViewEmails(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT, BUREAU, COMPTABILITE] — canViewEmails → email:manage
  return roleCan(role, "email:manage");
}

export function canViewNotifications(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT, BUREAU, COMPTABILITE] — canViewNotifications → notification:view
  return roleCan(role, "notification:view");
}

export function canUploadDocument(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT, BUREAU] — canUploadDocument → document:upload
  return roleCan(role, "document:upload");
}

// Envoi de notifications / e-mails au client : réservé à Exploitation, Admin et Déclarant. Demande cliente.
export function canNotifyClient(role: UserRole) {
  // [ADMIN, EXPLOITATION, DECLARANT] — canNotifyClient → dossier:notify_client
  return roleCan(role, "dossier:notify_client");
}
