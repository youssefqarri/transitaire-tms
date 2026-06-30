import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orgScope } from "@/lib/tenant";
import { canManageUsers, ROLE_LABELS, ROLE_TONE } from "@/lib/roles";
import type { UserRole } from "@/generated/prisma/enums";
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
import { UserActiveToggle } from "./user-active-toggle";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    name?: string;
    email?: string;
    role?: string;
    active?: string;
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
  const fName = params.name?.trim();
  const fEmail = params.email?.trim();
  const role = params.role && params.role in ROLE_LABELS ? (params.role as UserRole) : undefined;
  const active = params.active === "1" ? true : params.active === "0" ? false : undefined;
  const dir = params.dir === "asc" ? ("asc" as const) : ("desc" as const);
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });

  const orgId = session.user.orgId;
  const where = {
    ...orgScope(orgId),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(fName && { name: { contains: fName, mode: "insensitive" as const } }),
    ...(fEmail && { email: { contains: fEmail, mode: "insensitive" as const } }),
    ...(role && { role }),
    ...(active !== undefined && { active }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy:
        params.sort === "name"
          ? { name: dir }
          : params.sort === "email"
            ? { email: dir }
            : params.sort === "role"
              ? { role: dir }
              : params.sort === "active"
                ? { active: dir }
                : { createdAt: "desc" as const },
      skip,
      take: size,
      include: { client: { select: { name: true } } },
    }),
  ]);

  const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
  const hasFilter = !!q || !!fName || !!fEmail || !!role || active !== undefined;

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
        <TableMobileFilter
          searchPlaceholder="Rechercher (nom, email)…"
          selects={[
            { param: "role", placeholder: "Tous les rôles", options: roleOptions },
            {
              param: "active",
              placeholder: "Tous statuts",
              options: [
                { value: "1", label: "Actifs" },
                { value: "0", label: "Inactifs" },
              ],
            },
          ]}
        />

        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilter ? "Aucun résultat" : "Aucun utilisateur"}
            hint={hasFilter ? "Aucun utilisateur ne correspond à votre recherche." : undefined}
            cta={
              hasFilter ? (
                <Link href="/utilisateurs">
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
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-4">
                  <Avatar name={u.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px] truncate">{u.name}</div>
                    <div className="text-[12px] text-[var(--color-fg-3)] truncate">
                      {u.email}
                      {u.client && ` • ${u.client.name}`}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                      {!u.active && <Badge tone="danger" dot>Inactif</Badge>}
                    </div>
                  </div>
                  <UserActiveToggle userId={u.id} active={u.active} self={u.id === session.user.id} />
                </div>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[12px]">
                    <ColumnHeader label="Utilisateur" sortKey="name" filter={{ type: "text", param: "name" }} />
                    <ColumnHeader label="Email" sortKey="email" filter={{ type: "text", param: "email" }} />
                    <ColumnHeader label="Client" />
                    <ColumnHeader
                      label="Rôle"
                      className="w-[180px]"
                      sortKey="role"
                      filter={{ type: "select", param: "role", options: roleOptions }}
                    />
                    <ColumnHeader
                      label="Statut"
                      className="w-[140px]"
                      sortKey="active"
                      filter={{
                        type: "select",
                        param: "active",
                        options: [
                          { value: "1", label: "Actif" },
                          { value: "0", label: "Inactif" },
                        ],
                      }}
                    />
                    <th className="px-3 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size={30} />
                          <span className="font-medium text-[var(--color-fg)]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-2)]">{u.email}</td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-3)]">
                        {u.client?.name ?? <span className="text-[var(--color-fg-mute)]">—</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                      </td>
                      <td className="px-5 py-2.5">
                        {u.active ? (
                          <Badge tone="ok" dot>Actif</Badge>
                        ) : (
                          <Badge tone="danger" dot>Inactif</Badge>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <UserActiveToggle
                          userId={u.id}
                          active={u.active}
                          self={u.id === session.user.id}
                        />
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
          basePath="/utilisateurs"
          extraParams={{
            q: params.q,
            name: params.name,
            email: params.email,
            role: params.role,
            active: params.active,
            sort: params.sort,
            dir: params.dir,
          }}
        />
      </Card>
    </div>
  );
}
