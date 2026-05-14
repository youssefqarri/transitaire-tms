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
      image?: string | null;
    };
  }
  interface User {
    role: UserRole;
    clientId?: string | null;
  }
}

// config "Edge-safe" : pas de Prisma, pas de bcrypt.
// Utilisé par le middleware. La logique d'authentification réelle est dans auth.ts.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).role = user.role;
        (token as Record<string, unknown>).clientId = user.clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token as { role: UserRole }).role;
        session.user.clientId = (token as { clientId?: string | null }).clientId;
      }
      return session;
    },
  },
};
