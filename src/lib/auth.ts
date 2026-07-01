import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";
import { checkRateLimit } from "./ratelimit";
import type { UserRole } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        // Rate-limit anti brute-force (10 essais / 15 min par email)
        const rl = await checkRateLimit(`login:${email}`, 10, 15 * 60);
        if (!rl.ok) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password || !user.active) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          orgId: user.orgId,
          image: user.image,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  // callbacks surchargés ici (config Node) pour REVALIDER le JWT en base à chaque
  // requête authentifiée : compte désactivé OU tokenVersion incrémenté (reset/changement
  // de mot de passe) → session invalidée. Le middleware (auth.config, Edge) ne revalide pas,
  // mais auth() côté serveur le fait sur la 1re page/route.
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role: UserRole; clientId?: string | null; orgId?: string | null; tokenVersion?: number };
        (token as Record<string, unknown>).role = u.role;
        (token as Record<string, unknown>).clientId = u.clientId;
        (token as Record<string, unknown>).orgId = u.orgId;
        (token as Record<string, unknown>).tv = u.tokenVersion ?? 0;
        return token;
      }
      if (token.sub) {
        const db = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            active: true,
            role: true,
            clientId: true,
            orgId: true,
            tokenVersion: true,
            organization: {
              select: {
                active: true,
                subscription: {
                  select: { status: true, currentPeriodEnd: true, graceUntil: true },
                },
              },
            },
          },
        });
        if (!db || !db.active) return null; // compte supprimé/désactivé
        if (db.organization) {
          if (!db.organization.active) return null; // cabinet suspendu
          const sub = db.organization.subscription;
          if (sub) {
            const now = new Date();
            // Suspension/résiliation manuelle → accès coupé sans condition.
            if (sub.status === "SUSPENDED" || sub.status === "CANCELLED") return null;
            // Période expirée (hors essai) → accès coupé, SAUF rallonge exceptionnelle
            // en cours (graceUntil dans le futur) : pas de suspension automatique.
            if (sub.currentPeriodEnd && sub.currentPeriodEnd < now && sub.status !== "TRIAL") {
              const graceActive = sub.graceUntil != null && sub.graceUntil >= now;
              if (!graceActive) return null;
            }
          }
        }
        // tokenVersion : n'invalide que les jetons qui en portent un (évite la
        // déconnexion de masse des sessions émises avant ce déploiement)
        const tv = (token as { tv?: number }).tv;
        if (typeof tv === "number" && db.tokenVersion !== tv) return null;
        (token as Record<string, unknown>).role = db.role;
        (token as Record<string, unknown>).clientId = db.clientId;
        (token as Record<string, unknown>).orgId = db.orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token as { role: UserRole }).role;
        session.user.clientId = (token as { clientId?: string | null }).clientId;
        session.user.orgId = (token as { orgId?: string | null }).orgId;
      }
      return session;
    },
  },
});
