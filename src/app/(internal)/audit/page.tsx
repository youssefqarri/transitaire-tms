import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        title="Journal d'audit"
        subtitle={`${logs.length} dernières actions`}
      />
      <Card>
        <div className="divide-y divide-[var(--color-border)]">
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex items-center gap-3 text-[13px]">
              <Avatar name={l.user?.name ?? "?"} size={28} />
              <div className="flex-1 min-w-0">
                <div>
                  <span className="font-medium">{l.user?.name ?? "Système"}</span>{" "}
                  <Badge tone="outline">{l.action}</Badge>{" "}
                  <span className="text-[var(--color-fg-3)]">{l.entity}</span>
                  {l.entityId && (
                    <span className="text-[11.5px] text-[var(--color-fg-mute)]"> · {l.entityId.slice(0, 8)}</span>
                  )}
                </div>
              </div>
              <div className="text-[11.5px] text-[var(--color-fg-mute)] whitespace-nowrap">
                {formatDateTime(l.createdAt)}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-8 text-center text-[13px] text-[var(--color-fg-3)]">
              Aucune action enregistrée.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
