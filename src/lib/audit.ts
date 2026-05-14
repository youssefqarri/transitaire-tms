import { prisma } from "./db";

export async function audit(opts: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        metadata: opts.metadata as never,
      },
    });
  } catch {
    // ne jamais faire échouer une action métier à cause d'un audit log
  }
}
