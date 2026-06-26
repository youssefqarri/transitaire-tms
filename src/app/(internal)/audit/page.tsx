import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ColumnHeader } from "@/components/ui/column-header";
import { TableMobileFilter } from "@/components/ui/table-mobile-filter";
import { parsePagination } from "@/lib/pagination";
import { formatDateTime } from "@/lib/utils";
import { canManageUsers } from "@/lib/roles";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    user?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    sort?: string;
    dir?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");

  const q = params.q?.trim();
  const fUser = params.user?.trim();
  const action = params.action?.trim() || undefined;
  const entity = params.entity?.trim() || undefined;
  const fromD = params.from ? new Date(params.from) : undefined;
  const toD = params.to ? new Date(params.to) : undefined;
  const from = fromD && !Number.isNaN(fromD.getTime()) ? fromD : undefined;
  const to = toD && !Number.isNaN(toD.getTime()) ? toD : undefined;
  const dir = params.dir === "asc" ? ("asc" as const) : ("desc" as const);
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });

  const where = {
    ...(q && {
      OR: [
        { user: { name: { contains: q, mode: "insensitive" as const } } },
        { action: { contains: q, mode: "insensitive" as const } },
        { entity: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(fUser && { user: { name: { contains: fUser, mode: "insensitive" as const } } }),
    ...(action && { action }),
    ...(entity && { entity }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
  };

  const [total, logs, actionGroups, entityGroups] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy:
        params.sort === "user"
          ? { user: { name: dir } }
          : params.sort === "action"
            ? { action: dir }
            : params.sort === "entity"
              ? { entity: dir }
              : { createdAt: "desc" as const },
      skip,
      take: size,
      include: { user: { select: { name: true } } },
    }),
    // Options de filtre : toutes les valeurs existantes (indépendamment du filtre courant).
    prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
    prisma.auditLog.groupBy({ by: ["entity"], orderBy: { entity: "asc" } }),
  ]);

  const actionOptions = actionGroups.map((g) => ({ value: g.action, label: auditActionLabel(g.action) }));
  const entityOptions = entityGroups.map((g) => ({ value: g.entity, label: auditEntityLabel(g.entity) }));
  const hasFilter = !!q || !!fUser || !!action || !!entity || !!from || !!to;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Journal d'audit" subtitle={`${total} action${total > 1 ? "s" : ""}`} />
      <Card>
        <TableMobileFilter
          searchPlaceholder="Rechercher (utilisateur, action)…"
          selects={[
            { param: "action", placeholder: "Toutes les actions", options: actionOptions },
            { param: "entity", placeholder: "Toutes les entités", options: entityOptions },
          ]}
        />

        {logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={hasFilter ? "Aucun résultat" : "Aucune action enregistrée"}
            hint={
              hasFilter
                ? "Aucune action ne correspond à votre recherche."
                : "Les actions des utilisateurs apparaîtront ici au fil du temps."
            }
            cta={
              hasFilter ? (
                <Link href="/audit">
                  <Button variant="outline" size="sm">
                    Réinitialiser
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Mobile : cartes */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {logs.map((l) => (
                <div key={l.id} className="p-4 flex items-start gap-3 text-[13px]">
                  <Avatar name={l.user?.name ?? "?"} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[var(--color-fg)]">
                        {l.user?.name ?? "Système"}
                      </span>
                      <Badge tone="outline">{auditActionLabel(l.action)}</Badge>
                      <span className="text-[var(--color-fg-3)]">{auditEntityLabel(l.entity)}</span>
                    </div>
                    <div className="text-[12px] text-[var(--color-fg-mute)] mt-0.5">
                      {l.entityId && <span>• {l.entityId.slice(0, 8)} </span>}
                      {l.ip && <span className="tnum">• {l.ip} </span>}
                      • {formatDateTime(l.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[12px]">
                    <ColumnHeader label="Utilisateur" sortKey="user" filter={{ type: "text", param: "user" }} />
                    <ColumnHeader
                      label="Action"
                      className="w-[220px]"
                      sortKey="action"
                      filter={{ type: "select", param: "action", options: actionOptions }}
                    />
                    <ColumnHeader
                      label="Entité"
                      className="w-[150px]"
                      sortKey="entity"
                      filter={{ type: "select", param: "entity", options: entityOptions }}
                    />
                    <ColumnHeader label="Détail" />
                    <ColumnHeader
                      label="Date"
                      align="right"
                      sortKey="date"
                      filter={{ type: "date", fromParam: "from", toParam: "to" }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={l.user?.name ?? "?"} size={28} />
                          <span className="font-medium text-[var(--color-fg)]">
                            {l.user?.name ?? "Système"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge tone="outline">{auditActionLabel(l.action)}</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-3)]">{auditEntityLabel(l.entity)}</td>
                      <td className="px-5 py-2.5 text-[12px] text-[var(--color-fg-mute)] tnum">
                        {l.entityId && <span>{l.entityId.slice(0, 8)}</span>}
                        {l.ip && <span> • {l.ip}</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[12px] text-[var(--color-fg-mute)] whitespace-nowrap">
                        {formatDateTime(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Pagination
          page={page}
          pageSize={size}
          total={total}
          basePath="/audit"
          extraParams={{
            q: params.q,
            user: params.user,
            action: params.action,
            entity: params.entity,
            from: params.from,
            to: params.to,
            sort: params.sort,
            dir: params.dir,
          }}
        />
      </Card>
    </div>
  );
}
