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
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { UserActiveToggle } from "./user-active-toggle";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");

  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Utilisateurs"
        subtitle={`${total} compte${total > 1 ? "s" : ""}`}
        actions={
          <Link href="/utilisateurs/nouveau">
            <Button>
              <Plus className="size-4" /> Nouvel utilisateur
            </Button>
          </Link>
        }
      />

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={Users} title="Aucun utilisateur" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <Avatar name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px]">{u.name}</div>
                  <div className="text-[11.5px] text-[var(--color-fg-mute)]">
                    {u.email}
                    {u.client && ` · ${u.client.name}`}
                  </div>
                </div>
                <Badge tone={u.role === "CLIENT" ? "outline" : "info"}>
                  {ROLE_LABELS[u.role]}
                </Badge>
                {!u.active && <Badge tone="danger">Inactif</Badge>}
                <UserActiveToggle
                  userId={u.id}
                  active={u.active}
                  self={u.id === session.user.id}
                />
              </div>
            ))}
          </div>
        )}
        <Pagination
          page={page}
          pageSize={size}
          total={total}
          basePath="/utilisateurs"
        />
      </Card>
    </div>
  );
}
