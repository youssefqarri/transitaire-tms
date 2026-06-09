import bcrypt from "bcryptjs";
import { auth } from "./auth";
import { prisma } from "./db";
import type { UserRole } from "@/generated/prisma/enums";

export type AuthContext = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  clientId: string | null;
  orgId: string | null;
  via: "session" | "token";
};

// Auth helper unifié : essaie d'abord Bearer token, puis fallback session.
// Utiliser dans tous les handlers d'API.
export async function authenticate(req?: Request): Promise<AuthContext | null> {
  // 1) Bearer token
  const header = req?.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) {
    const raw = match[1].trim();
    if (raw.length >= 16) {
      const prefix = raw.slice(0, 8);
      const candidates = await prisma.apiToken.findMany({
        where: {
          prefix,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { user: true },
      });
      for (const cand of candidates) {
        if (await bcrypt.compare(raw, cand.tokenHash)) {
          // fire-and-forget : maj lastUsedAt
          prisma.apiToken
            .update({ where: { id: cand.id }, data: { lastUsedAt: new Date() } })
            .catch(() => {});
          if (!cand.user.active) return null;
          return {
            userId: cand.user.id,
            email: cand.user.email,
            name: cand.user.name,
            role: cand.user.role,
            clientId: cand.user.clientId,
            orgId: cand.user.orgId,
            via: "token",
          };
        }
      }
    }
  }
  // 2) Session NextAuth
  const session = await auth();
  if (session?.user) {
    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      clientId: session.user.clientId ?? null,
      orgId: session.user.orgId ?? null,
      via: "session",
    };
  }
  return null;
}

// Résout un dossier par id OU numéro, en appliquant l'isolation client :
// un CLIENT ne peut viser que ses propres dossiers. Retourne null aussi bien si
// le dossier n'existe pas que si l'accès est refusé (pas d'oracle 404 vs 403).
export async function resolveDossierForCtx(ctx: AuthContext, idOrNumber: string) {
  const dossier = await prisma.dossier.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { number: idOrNumber }],
      // isolation tenant (no-op tant que orgId n'est pas backfillé)
      ...(ctx.orgId ? { orgId: ctx.orgId } : {}),
    },
  });
  if (!dossier) return null;
  if (ctx.role === "CLIENT" && dossier.clientId !== ctx.clientId) return null;
  return dossier;
}

import crypto from "node:crypto";

export function generateApiToken(): { raw: string; prefix: string } {
  // format : ttms_<32 chars hex>
  const raw = `ttms_${crypto.randomBytes(24).toString("hex")}`;
  return { raw, prefix: raw.slice(0, 8) };
}
