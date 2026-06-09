import "server-only";
import { prisma } from "./db";

// Rate-limiting simple basé DB (fenêtre glissante par clé).
// Protège login/forgot/reset du brute-force. En cas d'erreur DB on n'empêche
// jamais un utilisateur légitime (fail-open).

export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { ok: true, retryAfter: 0 };
    }
    if (existing.count >= max) {
      return { ok: false, retryAfter: Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000) };
    }
    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { ok: true, retryAfter: 0 };
  } catch {
    return { ok: true, retryAfter: 0 };
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
