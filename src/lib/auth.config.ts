import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      clientId?: string | null;
      orgId?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role: UserRole;
    clientId?: string | null;
    orgId?: string | null;
    tokenVersion?: number;
  }
}

// config "Edge-safe" : pas de Prisma, pas de bcrypt.
// Utilisé par le middleware. La logique d'authentification réelle est dans auth.ts.
export const authConfig: NextAuthConfig = {
  // maxAge réduit (8h) : une désactivation/changement de rôle prend effet rapidement
  // (au lieu des ~30j par défaut). Revalidation DB complète = Phase 1 à tester runtime.
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).role = user.role;
        (token as Record<string, unknown>).clientId = user.clientId;
        (token as Record<string, unknown>).orgId = user.orgId;
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
};
