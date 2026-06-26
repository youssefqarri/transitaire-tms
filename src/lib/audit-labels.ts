// Libellés FR du journal d'audit. Les colonnes `action`/`entity` sont stockées
// en code technique (CREATE_USER, User…) ; on les affiche en clair côté UI.
// Module pur (aucune dépendance serveur) → importable partout.

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ADD_EXPECTED_DOC: "Document attendu ajouté",
  CANCEL_INVOICE: "Facture annulée",
  CHANGE_PASSWORD: "Mot de passe changé",
  CLIENT_CREATE_DOSSIER: "Dossier créé (espace client)",
  CLIENT_UPLOAD_DOCUMENT: "Document déposé (espace client)",
  CREATE_API_TOKEN: "Jeton API créé",
  CREATE_CLIENT: "Client créé",
  CREATE_CLIENT_CONTACT: "Contact client ajouté",
  CREATE_CREDIT_NOTE: "Avoir créé",
  CREATE_DOSSIER: "Dossier créé",
  CREATE_DUM: "DUM créée",
  CREATE_INVOICE: "Facture créée",
  CREATE_USER: "Utilisateur créé",
  DELETE_CLIENT_CONTACT: "Contact client supprimé",
  NOTIFY_CLIENT: "Client notifié",
  PASSWORD_RESET: "Mot de passe réinitialisé",
  REQUEST_PASSWORD_RESET: "Réinitialisation demandée",
  RESTORE: "Restauration (corbeille)",
  REVOKE_API_TOKEN: "Jeton API révoqué",
  SEND_INVOICE_EMAIL: "Facture envoyée par email",
  SOFT_DELETE_CLIENT: "Client supprimé",
  SOFT_DELETE_DOCUMENT: "Document supprimé",
  SOFT_DELETE_DOSSIER: "Dossier supprimé",
  SOFT_DELETE_EXPECTED_DOC: "Document attendu retiré",
  SOFT_DELETE_TEMPLATE: "Modèle supprimé",
  UPDATE_CLIENT: "Client modifié",
  UPDATE_CLIENT_TARIFFS: "Tarifs client modifiés",
  UPDATE_DOSSIER: "Dossier modifié",
  UPDATE_DUM: "DUM modifiée",
  UPDATE_EXPECTED_DOC: "Document attendu modifié",
  UPDATE_INVOICE: "Facture modifiée",
  UPDATE_SETTINGS: "Paramètres modifiés",
  UPDATE_STATUS: "Statut modifié",
  UPDATE_SUPPLIER: "Fournisseur modifié",
  UPDATE_TEMPLATE: "Modèle modifié",
  UPLOAD_DOCUMENT: "Document déposé",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  ApiToken: "Jeton API",
  AppSetting: "Paramètres",
  Client: "Client",
  CreditNote: "Avoir",
  DUM: "DUM",
  Document: "Document",
  Dossier: "Dossier",
  ExpectedDocument: "Document attendu",
  Invoice: "Facture",
  MessageTemplate: "Modèle de message",
  Supplier: "Fournisseur",
  User: "Utilisateur",
};

/** Libellé FR d'une action d'audit (repli sur le code brut si inconnu). */
export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

/** Libellé FR d'une entité d'audit (repli sur le code brut si inconnu). */
export function auditEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}
