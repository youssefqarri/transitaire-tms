// Isolation multi-tenant : filtre `orgId` à appliquer sur toutes les requêtes des
// tables racines (Client, Supplier, Dossier, Invoice, Notification, AuditLog,
// MessageTemplate, OutgoingMessage, EmailAccount, AppSetting, User).
//
// Usage :
//   - Routes API : `where: { ...orgScope(ctx.orgId), ... }` et `data: { ...orgData(ctx.orgId), ... }`
//   - Server Components : `where: { ...orgScope(session.user.orgId) }`
//
// `orgScope` est un NO-OP tant que orgId est null (avant backfill), ce qui rend la
// bascule progressive et n'introduit pas de régression sur l'instance mono-cabinet.

export function orgScope(orgId: string | null | undefined): { orgId?: string } {
  return orgId ? { orgId } : {};
}

// Pour les `create` : pose l'orgId si présent.
export function orgData(orgId: string | null | undefined): { orgId?: string } {
  return orgId ? { orgId } : {};
}
