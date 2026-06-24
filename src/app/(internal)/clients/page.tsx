import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });
  const [total, clients] = await Promise.all([
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { dossiers: { where: { deletedAt: null } }, users: true } } },
      skip,
      take: size,
    }),
  ]);

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
        {clients.length === 0 ? (
          <EmptyState icon={Building2} title="Aucun client" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Avatar name={c.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px] text-[var(--color-fg)] truncate">
                    {c.name}
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] truncate">
                    {c.code && <span>{c.code}</span>}
                    {c.code && (c.ice || c.city) && <span className="text-[var(--color-fg-mute)]"> · </span>}
                    {c.ice && <span>ICE {c.ice}</span>}
                    {c.ice && c.city && <span className="text-[var(--color-fg-mute)]"> · </span>}
                    {c.city}
                  </div>
                </div>
                <div className="text-right text-[12px] text-[var(--color-fg-3)] tnum">
                  <div>
                    <span className="font-semibold text-[var(--color-fg-2)]">{c._count.dossiers}</span>{" "}
                    dossier{c._count.dossiers > 1 ? "s" : ""}
                  </div>
                  <div className="text-[var(--color-fg-mute)]">
                    {c._count.users} utilisateur{c._count.users > 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pagination
          page={page}
          pageSize={size}
          total={total}
          basePath="/clients"
        />
      </Card>
    </div>
  );
}
