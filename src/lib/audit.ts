import { headers } from "next/headers";
import { prisma } from "./db";
import { orgData } from "./tenant";
import { auth } from "./auth";

export async function audit(opts: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  /** Org propriétaire (isolation multi-tenant). Source : ctx.orgId / session.user.orgId. */
  orgId?: string | null;
}) {
  // Capture IP + User-Agent depuis la requête courante (best-effort, sans changer les appelants)
  let ip: string | undefined;
  let userAgent: string | undefined;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || undefined;
    userAgent = h.get("user-agent") || undefined;
  } catch {
    // hors contexte requête : on ignore
  }
  // orgId : fourni par l'appelant, sinon résolu depuis la session courante (best-effort)
  // → garantit que les entrées d'audit portent l'org même là où l'appelant ne le passe pas.
  let orgId = opts.orgId ?? null;
  if (!orgId) {
    try {
      const s = await auth();
      orgId = s?.user.orgId ?? null;
    } catch {
      // hors contexte session (ex. tâche de fond) : on laisse null
    }
  }
  try {
    await prisma.auditLog.create({
      data: {
        ...orgData(orgId),
        userId: opts.userId,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        metadata: opts.metadata as never,
        ip,
        userAgent,
      },
    });
  } catch {
    // ne jamais faire échouer une action métier à cause d'un audit log
  }
}
