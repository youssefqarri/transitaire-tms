import "server-only";
import { prisma } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Entitlements (add-ons + quotas) — voir docs/PLAN-SAAS-MULTI-TENANT-RBAC.md.
//
// PRINCIPE « GRANDFATHER » : le cabinet historique (org_default) n'a AUCUN
// abonnement. Il doit conserver un accès total. Règle générale : tant qu'il
// n'existe pas de Subscription pour l'org (ou que orgId est absent), on ne
// restreint RIEN. La restriction ne s'applique QUE lorsqu'un abonnement existe
// et ne comporte pas le module / dépasse le quota.
// ─────────────────────────────────────────────────────────────────────────────

export type AddonKey = "WHATSAPP" | "API" | "REPORTING";

/**
 * TRUE si l'org a droit au module `addon`.
 * - orgId null/undefined      → TRUE (contexte sans org : pas de restriction)
 * - aucune Subscription        → TRUE (cabinet historique grandfathered)
 * - addon présent dans addons  → TRUE
 * - abonnement SANS l'addon     → FALSE (seul cas restrictif)
 */
export async function orgHasAddon(
  orgId: string | null | undefined,
  addon: AddonKey,
): Promise<boolean> {
  if (!orgId) return true;
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { addons: true },
  });
  if (!sub) return true; // grandfathered : pas d'abonnement = pas de limite
  return sub.addons.includes(addon);
}

/**
 * Usage vs quota mensuel de dossiers pour une org.
 * - quota null = illimité (pas d'abonnement, pas de plan, ou plan illimité).
 * - `over` = TRUE uniquement si un quota fini existe et est dépassé.
 * Ne bloque rien par lui-même : sert d'indicateur (dépassement facturable).
 */
export async function orgDossierQuota(
  orgId: string | null | undefined,
): Promise<{ used: number; quota: number | null; over: boolean }> {
  if (!orgId) return { used: 0, quota: null, over: false };

  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { plan: { select: { maxDossiersPerMonth: true } } },
  });
  // Pas d'abonnement / pas de plan / plan illimité → quota null (grandfathered).
  const quota = sub?.plan?.maxDossiersPerMonth ?? null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const used = await prisma.dossier.count({
    where: { orgId, createdAt: { gte: monthStart } },
  });

  return { used, quota, over: quota !== null && used > quota };
}
