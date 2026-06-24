import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { ColumnHeader } from "@/components/ui/column-header";
import { TableMobileFilter } from "@/components/ui/table-mobile-filter";
import { parsePagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    name?: string;
    code?: string;
    ice?: string;
    city?: string;
    sort?: string;
    dir?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const fName = params.name?.trim();
  const fCode = params.code?.trim();
  const fIce = params.ice?.trim();
  const fCity = params.city?.trim();
  const dir = params.dir === "asc" ? ("asc" as const) : ("desc" as const);
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });

  const where = {
    deletedAt: null,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { code: { contains: q, mode: "insensitive" as const } },
        { ice: { contains: q, mode: "insensitive" as const } },
        { city: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(fName && { name: { contains: fName, mode: "insensitive" as const } }),
    ...(fCode && { code: { contains: fCode, mode: "insensitive" as const } }),
    ...(fIce && { ice: { contains: fIce, mode: "insensitive" as const } }),
    ...(fCity && { city: { contains: fCity, mode: "insensitive" as const } }),
  };

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy:
        params.sort === "code"
          ? { code: { sort: dir, nulls: "last" } }
          : params.sort === "city"
            ? { city: { sort: dir, nulls: "last" } }
            : params.sort === "dossiers"
              ? { dossiers: { _count: dir } }
              : params.sort === "users"
                ? { users: { _count: dir } }
                : params.sort === "name"
                  ? { name: dir }
                  : { name: "asc" as const },
      include: { _count: { select: { dossiers: { where: { deletedAt: null } }, users: true } } },
      skip,
      take: size,
    }),
  ]);

  const hasFilter = !!q || !!fName || !!fCode || !!fIce || !!fCity;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        subtitle={`${total} client${total > 1 ? "s" : ""}`}
        actions={
          <Link href="/clients/nouveau">
            <Button>
              <Plus className="size-4" /> Nouveau client
            </Button>
          </Link>
        }
      />

      <Card>
        <TableMobileFilter searchPlaceholder="Rechercher (nom, code, ICE, ville)…" />

        {clients.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasFilter ? "Aucun résultat" : "Aucun client"}
            hint={hasFilter ? "Aucun client ne correspond à votre recherche." : undefined}
            cta={
              hasFilter ? (
                <Link href="/clients">
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
              {clients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Avatar name={c.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px] text-[var(--color-fg)] truncate">
                      {c.name}
                    </div>
                    <div className="text-[12px] text-[var(--color-fg-3)] truncate">
                      {c.code && <span>{c.code}</span>}
                      {c.code && c.city && <span className="text-[var(--color-fg-mute)]"> • </span>}
                      {c.city}
                    </div>
                  </div>
                  <div className="text-right text-[12px] text-[var(--color-fg-3)] tnum shrink-0">
                    <span className="font-semibold text-[var(--color-fg-2)]">{c._count.dossiers}</span>{" "}
                    doss.
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[12px]">
                    <ColumnHeader label="Client" sortKey="name" filter={{ type: "text", param: "name" }} />
                    <ColumnHeader label="Code" sortKey="code" filter={{ type: "text", param: "code" }} />
                    <ColumnHeader label="ICE" filter={{ type: "text", param: "ice" }} />
                    <ColumnHeader label="Ville" sortKey="city" filter={{ type: "text", param: "city" }} />
                    <ColumnHeader label="Dossiers" align="right" sortKey="dossiers" />
                    <ColumnHeader label="Utilisateurs" align="right" sortKey="users" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/clients/${c.id}`}
                          className="flex items-center gap-2.5 font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]"
                        >
                          <Avatar name={c.name} size={30} />
                          <span className="truncate">{c.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[var(--color-fg-3)]">
                        {c.code ?? <span className="text-[var(--color-fg-mute)]">—</span>}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[var(--color-fg-3)]">
                        {c.ice ?? <span className="text-[var(--color-fg-mute)]">—</span>}
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-3)]">
                        {c.city ?? <span className="text-[var(--color-fg-mute)]">—</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg-2)]">
                        {c._count.dossiers}
                      </td>
                      <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg-3)]">
                        {c._count.users}
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
          basePath="/clients"
          extraParams={{
            q: params.q,
            name: params.name,
            code: params.code,
            ice: params.ice,
            city: params.city,
            sort: params.sort,
            dir: params.dir,
          }}
        />
      </Card>
    </div>
  );
}
