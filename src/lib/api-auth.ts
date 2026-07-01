import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { prisma } from "./db";
import { checkRateLimit, clientIp } from "./ratelimit";
import { orgScope } from "./tenant";
import { orgHasAddon } from "./entitlements";
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
    // rate-limit anti brute-force de tokens sur l'API v1 (par IP, généreux)
    if (req) {
      const rl = await checkRateLimit(`v1:${clientIp(req)}`, 120, 60);
      if (!rl.ok) return null;
    }
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

// Gating add-on API : l'accès par TOKEN (API publique v1) exige le module "API"
// dès qu'un abonnement existe. L'accès par SESSION (UI interne) n'est jamais bridé.
// org_default (aucun abonnement) est grandfathered → orgHasAddon renvoie true.
// Retourne une réponse 403 prête à renvoyer si l'accès est refusé, sinon null.
export async function requireApiAddon(ctx: AuthContext): Promise<NextResponse | null> {
  if (ctx.via !== "token") return null; // UI interne : non concernée
  if (await orgHasAddon(ctx.orgId, "API")) return null;
  return NextResponse.json(
    { error: "Le module API n'est pas inclus dans l'abonnement de ce cabinet." },
    { status: 403 },
  );
}

// Résout un dossier par id OU numéro, en appliquant l'isolation client :
// un CLIENT ne peut viser que ses propres dossiers. Retourne null aussi bien si
// le dossier n'existe pas que si l'accès est refusé (pas d'oracle 404 vs 403).
export async function resolveDossierForCtx(ctx: AuthContext, idOrNumber: string) {
  const dossier = await prisma.dossier.findFirst({
    where: {
      deletedAt: null,
      ...orgScope(ctx.orgId),
      OR: [{ id: idOrNumber }, { number: idOrNumber }],
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
