import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { formatDateTime } from "@/lib/utils";
import { canManageUsers } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });
  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      include: { user: { select: { name: true } } },
    }),
  ]);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Journal d'audit"
        subtitle={`${total} actions`}
      />
      <Card>
        {logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune action enregistrée"
            hint="Les actions des utilisateurs apparaîtront ici au fil du temps."
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {logs.map((l) => (
              <div
                key={l.id}
                className="p-4 flex items-center gap-3 text-[13px] hover:bg-[var(--color-surface-2)]/50 transition-colors"
              >
                <Avatar name={l.user?.name ?? "?"} size={28} />
                <div className="flex-1 min-w-0">
                  <div>
                    <span className="font-medium text-[var(--color-fg)]">{l.user?.name ?? "Système"}</span>{" "}
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
          </div>
        )}
        <Pagination
          page={page}
          pageSize={size}
          total={total}
          basePath="/audit"
        />
      </Card>
    </div>
  );
}
