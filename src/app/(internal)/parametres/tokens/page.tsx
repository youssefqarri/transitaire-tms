import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers, ROLE_LABELS } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { TokensClient } from "./tokens-client";

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");

  const [tokens, users] = await Promise.all([
    prisma.apiToken.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.user.findMany({
      where: { active: true, role: { not: "CLIENT" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Link
          href="/parametres"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-4" /> Retour aux paramètres
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-3">Tokens API</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Tokens d'accès pour intégrations externes (Claude, scripts, etc.). Chaque token hérite des
          permissions de son utilisateur associé.
        </p>
      </div>

      <Card className="p-6">
        <TokensClient
          tokens={tokens.map((t) => ({
            id: t.id,
            label: t.label,
            prefix: t.prefix,
            userName: t.user.name,
            userEmail: t.user.email,
            userRole: ROLE_LABELS[t.user.role],
            createdAt: t.createdAt.toISOString(),
            lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
            expiresAt: t.expiresAt?.toISOString() ?? null,
            revoked: !!t.revokedAt,
          }))}
          users={users.map((u) => ({
            id: u.id,
            label: `${u.name} (${ROLE_LABELS[u.role]})`,
          }))}
        />
      </Card>
    </div>
  );
}
