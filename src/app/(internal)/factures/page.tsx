import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) return null;

  const invoices = await prisma.invoice.findMany({
    orderBy: [{ year: "desc" }, { sequence: "desc" }],
    take: 200,
    include: { client: true, items: true },
  });

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
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Factures</h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} · Total facturé{" "}
            <span className="text-[var(--color-fg)] font-medium tnum">
              {formatMAD(totalIssued)}
            </span>
          </p>
        </div>
        <Link href="/factures/nouvelle">
          <Button>
            <Plus /> Nouvelle facture
          </Button>
        </Link>
      </header>

      <Card>
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="size-8 mx-auto text-[var(--color-fg-mute)] mb-2" strokeWidth={1.5} />
            <div className="text-[14px] font-medium">Aucune facture</div>
            <div className="text-[12.5px] text-[var(--color-fg-3)] mt-1">
              Créez votre première facture pour commencer.
            </div>
          </div>
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
                    className="block px-4 py-3 hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-mono font-medium text-[14px] text-[var(--color-fg)]">
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
                      <span className="text-[11px] text-[var(--color-fg-3)]">
                        {formatDate(inv.issuedAt)}
                        {inv.dueAt && ` · Éch. ${formatDate(inv.dueAt)}`}
                      </span>
                      <span className="font-mono text-[13.5px] tnum font-medium text-[var(--color-fg)]">
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
                  <tr className="border-b border-[var(--color-border)] text-[11.5px] font-medium text-[var(--color-fg-3)]">
                    <th className="text-left px-5 py-2.5">N°</th>
                    <th className="text-left px-5 py-2.5">Client</th>
                    <th className="text-left px-5 py-2.5">Émise le</th>
                    <th className="text-left px-5 py-2.5">Échéance</th>
                    <th className="text-right px-5 py-2.5">Total TTC</th>
                    <th className="text-left px-5 py-2.5">Statut</th>
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
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]"
                      >
                        <td className="px-5 py-2.5">
                          <Link
                            href={`/factures/${inv.id}`}
                            className="font-mono font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]"
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
          </>
        )}
      </Card>
    </div>
  );
}
