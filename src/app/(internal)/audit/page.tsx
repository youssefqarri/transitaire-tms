import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { canManageUsers } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } } },
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Journal d'audit</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          {logs.length} dernières actions
        </p>
      </div>
      <Card>
        <div className="divide-y divide-[var(--color-border)]">
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex items-center gap-3 text-sm">
              <Avatar name={l.user?.name ?? "?"} size={28} />
              <div className="flex-1 min-w-0">
                <div>
                  <span className="font-medium">{l.user?.name ?? "Système"}</span>{" "}
                  <Badge tone="outline">{l.action}</Badge>{" "}
                  <span className="text-[var(--color-muted-foreground)]">{l.entity}</span>
                  {l.entityId && (
                    <span className="text-xs text-[var(--color-muted-foreground)]"> · {l.entityId.slice(0, 8)}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                {formatDateTime(l.createdAt)}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Aucune action enregistrée.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
