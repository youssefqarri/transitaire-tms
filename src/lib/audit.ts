import { headers } from "next/headers";
import { prisma } from "./db";

export async function audit(opts: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
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
  try {
    await prisma.auditLog.create({
      data: {
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
