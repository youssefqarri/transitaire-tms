import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canViewInvoices } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ColumnHeader } from "@/components/ui/column-header";
import { RowLink, CellLink } from "@/components/ui/clickable-row";
import { TableMobileFilter } from "@/components/ui/table-mobile-filter";
import { parsePagination } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, formatMAD, totals } from "@/lib/invoicing";
import type { InvoiceStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const TONE_BY_STATUS = {
  DRAFT: "neutral",
  SENT: "info",
  PARTIALLY_PAID: "warn",
  PAID: "ok",
  CANCELLED: "danger",
  OVERDUE: "danger",
} as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    number?: string;
    clientName?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;
  if (!canViewInvoices(session.user.role)) redirect("/dashboard");

  const q = params.q?.trim();
  const fNumber = params.number?.trim();
  const fClient = params.clientName?.trim();
  const status =
    params.status && params.status in INVOICE_STATUS_LABELS
      ? (params.status as InvoiceStatus)
      : undefined;
  const dir = params.dir === "asc" ? ("asc" as const) : ("desc" as const);
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });

  const where = {
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" as const } },
        { client: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
    ...(fNumber && { number: { contains: fNumber, mode: "insensitive" as const } }),
    ...(fClient && { client: { name: { contains: fClient, mode: "insensitive" as const } } }),
    ...(status && { status }),
  };

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy:
        params.sort === "number"
          ? { number: dir }
          : params.sort === "client"
            ? { client: { name: dir } }
            : params.sort === "issued"
              ? { issuedAt: { sort: dir, nulls: "last" } }
              : params.sort === "due"
                ? { dueAt: { sort: dir, nulls: "last" } }
                : params.sort === "status"
                  ? { status: dir }
                  : [{ year: "desc" as const }, { sequence: "desc" as const }],
      skip,
      take: size,
      include: { client: true, items: true },
    }),
  ]);

  const totalIssued = invoices
    .filter((i) => i.status !== "CANCELLED" && i.status !== "DRAFT")
    .reduce((s, i) => {
      const t = totals(
        i.items.map((it) => ({
          kind: it.kind,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          vatRate: Number(it.vatRate),
        })),
      );
      return s + t.totalTTC;
    }, 0);

  const statusOptions = Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const hasFilter = !!q || !!fNumber || !!fClient || !!status;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Factures"
        subtitle={
          <>
            {total} facture{total > 1 ? "s" : ""} • Total facturé{" "}
            <span className="text-[var(--color-fg)] font-medium tnum">{formatMAD(totalIssued)}</span>
          </>
        }
        actions={
          <Link href="/factures/nouvelle">
            <Button>
              <Plus /> Nouvelle facture
            </Button>
          </Link>
        }
      />

      <Card>
        <TableMobileFilter
          searchPlaceholder="Rechercher (n°, client)…"
          selects={[{ param: "status", placeholder: "Tous statuts", options: statusOptions }]}
        />

        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasFilter ? "Aucun résultat" : "Aucune facture"}
            hint={
              hasFilter
                ? "Aucune facture ne correspond à votre recherche."
                : "Créez votre première facture pour commencer."
            }
            cta={
              hasFilter ? (
                <Link href="/factures">
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
              {invoices.map((inv) => {
                const t = totals(
                  inv.items.map((it) => ({
                    kind: it.kind,
                    description: it.description,
                    quantity: Number(it.quantity),
                    unitPrice: Number(it.unitPrice),
                    vatRate: Number(it.vatRate),
                  })),
                );
                return (
                  <Link
                    key={inv.id}
                    href={`/factures/${inv.id}`}
                    className="row-link block px-4 py-3 hover:bg-[var(--color-surface-2)]/50 active:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-mono font-medium text-[13px] text-[var(--color-fg)]">
                        {inv.number}
                      </span>
                      <Badge tone={TONE_BY_STATUS[inv.status]}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </div>
                    <div className="text-[13px] text-[var(--color-fg-3)] truncate">
                      {inv.client.name}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[12px] text-[var(--color-fg-3)]">
                        {formatDate(inv.issuedAt)}
                        {inv.dueAt && ` • Éch. ${formatDate(inv.dueAt)}`}
                      </span>
                      <span className="font-mono text-[13px] tnum font-medium text-[var(--color-fg)]">
                        {formatMAD(t.totalTTC)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <ColumnHeader label="N° de facture" sortKey="number" filter={{ type: "text", param: "number" }} />
                    <ColumnHeader label="Client" sortKey="client" filter={{ type: "text", param: "clientName" }} />
                    <ColumnHeader label="Émise le" sortKey="issued" />
                    <ColumnHeader label="Échéance" sortKey="due" />
                    <ColumnHeader label="Total TTC" align="right" />
                    <ColumnHeader
                      label="Statut"
                      className="w-[150px]"
                      sortKey="status"
                      filter={{ type: "select", param: "status", options: statusOptions }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const t = totals(
                      inv.items.map((it) => ({
                        kind: it.kind,
                        description: it.description,
                        quantity: Number(it.quantity),
                        unitPrice: Number(it.unitPrice),
                        vatRate: Number(it.vatRate),
                      })),
                    );
                    return (
                      <RowLink
                        key={inv.id}
                        href={`/factures/${inv.id}`}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/50 transition-colors"
                      >
                        <td className="px-5 py-2.5">
                          <CellLink
                            href={`/factures/${inv.id}`}
                            className="font-mono font-medium text-[var(--color-fg)]"
                          >
                            {inv.number}
                          </CellLink>
                        </td>
                        <td className="px-5 py-2.5 max-w-[240px] text-[var(--color-fg-3)]">
                          <CellLink newTab href={`/clients/${inv.clientId}`} className="block truncate">
                            {inv.client.name}
                          </CellLink>
                        </td>
                        <td className="px-5 py-2.5 text-[var(--color-fg-3)] whitespace-nowrap">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="px-5 py-2.5 text-[var(--color-fg-3)] whitespace-nowrap">
                          {formatDate(inv.dueAt)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg)] whitespace-nowrap">
                          {formatMAD(t.totalTTC)}
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge tone={TONE_BY_STATUS[inv.status]}>
                            {INVOICE_STATUS_LABELS[inv.status]}
                          </Badge>
                        </td>
                      </RowLink>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={size}
              total={total}
              basePath="/factures"
              extraParams={{
                q: params.q,
                number: params.number,
                clientName: params.clientName,
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
