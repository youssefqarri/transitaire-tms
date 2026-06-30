// Isolation multi-tenant : filtre `orgId` à appliquer sur les requêtes des tables
// racines (appartenant à une Organization). Voir docs/PLAN-SAAS-MULTI-TENANT-RBAC.md.
//
// Usage :
//   - Lecture (Server Components + routes) : where: { ...orgScope(orgId), ... }
//   - Écriture (create)                    : data:  { ...orgData(orgId), ... }
//
// `orgScope`/`orgData` sont des NO-OP tant que `orgId` est null/undefined (phase de
// fondation, avant la bascule du sweep) → aucune régression sur l'instance mono-cabinet
// existante. Une fois le backfill fait et `session.user.orgId` peuplé, le scoping
// s'active automatiquement partout où les helpers sont appliqués.

export function orgScope(orgId: string | null | undefined): { orgId?: string } {
  return orgId ? { orgId } : {};
}

export function orgData(orgId: string | null | undefined): { orgId?: string } {
  return orgId ? { orgId } : {};
}
