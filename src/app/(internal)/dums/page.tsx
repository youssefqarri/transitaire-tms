import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DumStatusBadge } from "@/components/dossier/dum-status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ColumnHeader } from "@/components/ui/column-header";
import { TableMobileFilter } from "@/components/ui/table-mobile-filter";
import { parsePagination } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import type { DUMStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function DUMsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    number?: string;
    dossier?: string;
    clientName?: string;
    bureau?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const fNumber = params.number?.trim();
  const fDossier = params.dossier?.trim();
  const fClient = params.clientName?.trim();
  const fBureau = params.bureau?.trim();
  const status =
    params.status && params.status in DUM_STATUS_LABELS
      ? (params.status as DUMStatus)
      : undefined;
  const dir = params.dir === "asc" ? ("asc" as const) : ("desc" as const);
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });

  const ci = (v: string) => ({ contains: v, mode: "insensitive" as const });
  const dossierFilter = {
    ...(fDossier && { number: ci(fDossier) }),
    ...(fClient && { client: { name: ci(fClient) } }),
  };
  const where = {
    ...(q && {
      OR: [
        { number: ci(q) },
        { dossier: { number: ci(q) } },
        { dossier: { client: { name: ci(q) } } },
      ],
    }),
    ...(fNumber && { number: ci(fNumber) }),
    ...(Object.keys(dossierFilter).length > 0 && { dossier: dossierFilter }),
    ...(fBureau && { bureau: ci(fBureau) }),
    ...(status && { status }),
  };

  const [total, dums] = await Promise.all([
    prisma.dUM.count({ where }),
    prisma.dUM.findMany({
      where,
      orderBy:
        params.sort === "number"
          ? { number: dir }
          : params.sort === "dossier"
            ? { dossier: { number: dir } }
            : params.sort === "client"
              ? { dossier: { client: { name: dir } } }
              : params.sort === "bureau"
                ? { bureau: { sort: dir, nulls: "last" } }
                : params.sort === "status"
                  ? { status: dir }
                  : params.sort === "registered"
                    ? { registeredAt: { sort: dir, nulls: "last" } }
                    : [{ status: "asc" as const }, { createdAt: "desc" as const }],
      skip,
      take: size,
      include: { dossier: { include: { client: true } } },
    }),
  ]);

  const statusOptions = Object.entries(DUM_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  const hasFilter = !!q || !!fNumber || !!fDossier || !!fClient || !!fBureau || !!status;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="DUMs" subtitle={`${total} déclaration${total > 1 ? "s" : ""}`} />
      <Card>
        <TableMobileFilter
          searchPlaceholder="Rechercher (n° DUM, dossier, client)…"
          selects={[{ param: "status", placeholder: "Tous statuts", options: statusOptions }]}
        />

        {dums.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={hasFilter ? "Aucun résultat" : "Aucune DUM"}
            hint={
              hasFilter
                ? "Aucune DUM ne correspond à votre recherche."
                : "Les DUMs sont créées depuis chaque dossier."
            }
            cta={
              hasFilter ? (
                <Link href="/dums">
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
              {dums.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.dossier.id}`}
                  className="block px-4 py-3 hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="font-mono font-medium text-[14px] text-[var(--color-fg)]">
                      {d.number}
                    </span>
                    <DumStatusBadge status={d.status} />
                  </div>
                  <div className="text-[13px] text-[var(--color-fg-2)]">
                    <span className="font-mono">{d.dossier.number}</span> • {d.dossier.client.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-fg-3)] mt-1">
                    <span>{d.bureau ?? "Bureau ?"}</span>
                    <span>{formatDate(d.registeredAt)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[12px]">
                    <ColumnHeader label="N° DUM" sortKey="number" filter={{ type: "text", param: "number" }} />
                    <ColumnHeader label="Dossier" sortKey="dossier" filter={{ type: "text", param: "dossier" }} />
                    <ColumnHeader label="Client" sortKey="client" filter={{ type: "text", param: "clientName" }} />
                    <ColumnHeader label="Bureau" sortKey="bureau" filter={{ type: "text", param: "bureau" }} />
                    <ColumnHeader
                      label="Statut"
                      className="w-[150px]"
                      sortKey="status"
                      filter={{ type: "select", param: "status", options: statusOptions }}
                    />
                    <ColumnHeader label="Date d'enregistrement" shortLabel="Enregistré" align="right" sortKey="registered" />
                  </tr>
                </thead>
                <tbody>
                  {dums.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/50"
                    >
                      <td className="px-5 py-2.5 font-mono font-medium">{d.number}</td>
                      <td className="px-5 py-2.5">
                        <Link
                          className="font-mono text-[var(--color-accent)] hover:underline"
                          href={`/dossiers/${d.dossier.id}`}
                        >
                          {d.dossier.number}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link
                          className="text-[var(--color-accent)] hover:underline"
                          href={`/clients/${d.dossier.client.id}`}
                        >
                          {d.dossier.client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-3)]">{d.bureau ?? "—"}</td>
                      <td className="px-5 py-2.5">
                        <DumStatusBadge status={d.status} />
                      </td>
                      <td className="px-5 py-2.5 text-right text-[13px] text-[var(--color-fg-3)] whitespace-nowrap">
                        {formatDate(d.registeredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={size}
              total={total}
              basePath="/dums"
              extraParams={{
                q: params.q,
                number: params.number,
                dossier: params.dossier,
                clientName: params.clientName,
                bureau: params.bureau,
                status: params.status,
                sort: params.sort,
                dir: params.dir,
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
