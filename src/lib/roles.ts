import { UserRole } from "@/generated/prisma/enums";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  EXPLOITATION: "Exploitation",
  DECLARANT: "Déclarant",
  COMMIS_DOUANE: "Commis en douane",
  BUREAU: "Bureau administratif",
  COMPTABILITE: "Comptabilité",
  CLIENT: "Client",
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

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}

// Saisie du référentiel commercial (clients, fournisseurs, contacts) : réservée à
// Exploitation + Admin ; les autres rôles internes consultent seulement. Demande cliente.
export function canManageRegistry(role: UserRole) {
  return ["ADMIN", "EXPLOITATION"].includes(role);
}

// Gestion de la facturation (création/édition/encaissement) : seuls ADMIN et
// COMPTABILITE (cohérent avec l'accès page /factures).
export function canManageInvoices(role: UserRole) {
  return ["ADMIN", "COMPTABILITE"].includes(role);
}

export function canCreateDossier(role: UserRole) {
  return ["ADMIN", "EXPLOITATION"].includes(role);
}

// Saisie / modification des dossiers : réservée à Exploitation + Admin ; les autres
// rôles consultent seulement (Déclarant, Bureau, Commis, Compta). Demande cliente.
export function canModifyDossier(role: UserRole) {
  return ["ADMIN", "EXPLOITATION"].includes(role);
}

export function canCloseDossier(role: UserRole) {
  return ["ADMIN", "DECLARANT", "BUREAU"].includes(role);
}

// Saisie des DUM : réservée à Exploitation + Admin. Le Déclarant dépose la DUM dans
// BADR ; l'Exploitant la saisit ici. Les autres consultent seulement. Demande cliente.
export function canCreateDUM(role: UserRole) {
  return ["ADMIN", "EXPLOITATION"].includes(role);
}

export function canViewAccountingEmails(role: UserRole) {
  return ["ADMIN", "COMPTABILITE"].includes(role);
}

export function canViewCustomsEmails(role: UserRole) {
  // COMMIS_DOUANE = consultation seulement, pas d'accès emails
  return ["ADMIN", "DECLARANT", "BUREAU"].includes(role);
}

// Profil "consultation seule" — réservé COMMIS_DOUANE pour l'instant.
// Voir aussi can* ci-dessus qui doivent tous le retourner à false.
export function isReadOnly(role: UserRole) {
  return role === "COMMIS_DOUANE";
}

export function canViewClients(role: UserRole) {
  return isInternal(role) && role !== "COMMIS_DOUANE";
}

export function canViewSuppliers(role: UserRole) {
  return isInternal(role) && role !== "COMMIS_DOUANE";
}

// Facturation = Comptabilité + Administrateur UNIQUEMENT — ni saisie ni
// consultation pour Exploitation, Déclarant, Commis en douane, Bureau, Client
// (exigence cliente Transit Multiservices, 19/06/2026). Cohérent avec
// canManageInvoices et FACTURATION_ACCESS (nav).
export function canViewInvoices(role: UserRole) {
  return ["ADMIN", "COMPTABILITE"].includes(role);
}

export function canViewEmails(role: UserRole) {
  return ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU", "COMPTABILITE"].includes(role);
}

export function canViewNotifications(role: UserRole) {
  return ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU", "COMPTABILITE"].includes(role);
}

export function canUploadDocument(role: UserRole) {
  return ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU"].includes(role);
}

// Envoi de notifications / e-mails au client : réservé à Exploitation + Admin. Demande cliente.
export function canNotifyClient(role: UserRole) {
  return ["ADMIN", "EXPLOITATION"].includes(role);
}
