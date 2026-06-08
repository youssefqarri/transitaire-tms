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

export function canCreateDossier(role: UserRole) {
  return ["ADMIN", "EXPLOITATION"].includes(role);
}

export function canModifyDossier(role: UserRole) {
  return ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU"].includes(role);
}

export function canCloseDossier(role: UserRole) {
  return ["ADMIN", "DECLARANT", "BUREAU"].includes(role);
}

export function canCreateDUM(role: UserRole) {
  // Exploitation peut saisir les numéros de DUM au même titre que le Déclarant.
  return ["ADMIN", "EXPLOITATION", "DECLARANT"].includes(role);
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

export function canViewInvoices(role: UserRole) {
  return ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU", "COMPTABILITE"].includes(role);
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

export function canNotifyClient(role: UserRole) {
  return ["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU"].includes(role);
}
