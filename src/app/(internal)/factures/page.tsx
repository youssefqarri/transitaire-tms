import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { orgScope } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, formatMAD, totals } from "@/lib/invoicing";

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
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;

  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });
  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where: { ...orgScope(session.user.orgId) } }),
    prisma.invoice.findMany({
      where: { ...orgScope(session.user.orgId) },
      orderBy: [{ year: "desc" }, { sequence: "desc" }],
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Factures"
        subtitle={
          <>
            {total} facture{total > 1 ? "s" : ""} · Total facturé{" "}
            <span className="text-[var(--color-fg)] font-medium tnum">
              {formatMAD(totalIssued)}
            </span>
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
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucune facture"
            hint="Créez votre première facture pour commencer."
          />
        ) : (
          <>
            {/* Mobile: cartes */}
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
                    <div className="text-[13px] text-[var(--color-fg-2)] truncate">
                      {inv.client.name}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11.5px] text-[var(--color-fg-3)]">
                        {formatDate(inv.issuedAt)}
                        {inv.dueAt && ` · Éch. ${formatDate(inv.dueAt)}`}
                      </span>
                      <span className="font-mono text-[13px] tnum font-medium text-[var(--color-fg)]">
                        {formatMAD(t.totalTTC)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop: tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left text-[11.5px] font-medium text-[var(--color-fg-3)] px-5 py-2.5">N°</th>
                    <th className="text-left text-[11.5px] font-medium text-[var(--color-fg-3)] px-5 py-2.5">Client</th>
                    <th className="text-left text-[11.5px] font-medium text-[var(--color-fg-3)] px-5 py-2.5">Émise le</th>
                    <th className="text-left text-[11.5px] font-medium text-[var(--color-fg-3)] px-5 py-2.5">Échéance</th>
                    <th className="text-right text-[11.5px] font-medium text-[var(--color-fg-3)] px-5 py-2.5">Total TTC</th>
                    <th className="text-left text-[11.5px] font-medium text-[var(--color-fg-3)] px-5 py-2.5">Statut</th>
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
                      <tr
                        key={inv.id}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/50 transition-colors"
                      >
                        <td className="px-5 py-2.5">
                          <Link
                            href={`/factures/${inv.id}`}
                            className="row-link font-mono font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]"
                          >
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-5 py-2.5 truncate max-w-[240px] text-[var(--color-fg-2)]">
                          {inv.client.name}
                        </td>
                        <td className="px-5 py-2.5 text-[var(--color-fg-3)]">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="px-5 py-2.5 text-[var(--color-fg-3)]">
                          {formatDate(inv.dueAt)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg)]">
                          {formatMAD(t.totalTTC)}
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge tone={TONE_BY_STATUS[inv.status]}>
                            {INVOICE_STATUS_LABELS[inv.status]}
                          </Badge>
                        </td>
                      </tr>
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
            />
          </>
        )}
      </Card>
    </div>
  );
}
