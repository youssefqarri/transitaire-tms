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
  return ["ADMIN", "DECLARANT"].includes(role);
}

export function canViewAccountingEmails(role: UserRole) {
  return ["ADMIN", "COMPTABILITE"].includes(role);
}

export function canViewCustomsEmails(role: UserRole) {
  return ["ADMIN", "COMMIS_DOUANE", "DECLARANT", "BUREAU"].includes(role);
}
