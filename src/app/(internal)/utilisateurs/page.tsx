import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers, ROLE_LABELS } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {users.length} compte{users.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/utilisateurs/nouveau">
          <Button>
            <Plus className="size-4" /> Nouvel utilisateur
          </Button>
        </Link>
      </div>

      <Card>
        {users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucun utilisateur</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <Avatar name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{u.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {u.email}
                    {u.client && ` · ${u.client.name}`}
                  </div>
                </div>
                <Badge tone={u.role === "CLIENT" ? "outline" : "info"}>
                  {ROLE_LABELS[u.role]}
                </Badge>
                {!u.active && <Badge tone="danger">Inactif</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
