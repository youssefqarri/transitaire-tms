import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Printer, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canViewInvoices } from "@/lib/roles";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_ITEM_KIND_LABELS,
  CREDIT_NOTE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatMAD,
  totals,
} from "@/lib/invoicing";
import { formatDate } from "@/lib/utils";
import { InvoiceActions } from "./actions";
import { SendInvoiceButton } from "./send-button";
import { CreditNoteButton } from "./credit-note-button";

export const dynamic = "force-dynamic";

const TONE_BY_STATUS = {
  DRAFT: "neutral",
  SENT: "info",
  PARTIALLY_PAID: "warn",
  PAID: "ok",
  CANCELLED: "danger",
  OVERDUE: "danger",
} as const;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;
  if (!canViewInvoices(session.user.role)) redirect("/dashboard");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { order: "asc" }, include: { dossier: { select: { number: true } } } },
      creditNotes: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      createdBy: { select: { name: true } },
    },
  });
  if (!invoice) notFound();

  const computed = totals(
    invoice.items.map((it) => ({
      kind: it.kind,
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      vatRate: Number(it.vatRate),
    })),
  );

  // Avoirs (hors annulés) → réduisent le net à payer.
  const activeCredits = invoice.creditNotes.filter((c) => c.status !== "CANCELLED");
  const totalCredits = activeCredits.reduce((s, c) => s + Number(c.amount), 0);
  const netDue = Math.max(0, computed.totalTTC - Number(invoice.paidAmount) - totalCredits);

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      <BackLink href="/factures">Retour aux factures</BackLink>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-mono font-semibold tracking-tight text-[var(--color-fg)]">
              {invoice.number}
            </h1>
            <Badge tone={TONE_BY_STATUS[invoice.status]}>
              {INVOICE_STATUS_LABELS[invoice.status]}
            </Badge>
          </div>
          <p className="text-[13px] text-[var(--color-fg-3)]">
            Pour <span className="text-[var(--color-fg)] font-medium">{invoice.client.name}</span>
            {invoice.issuedAt && ` · émise le ${formatDate(invoice.issuedAt)}`}
            {invoice.createdBy && ` · par ${invoice.createdBy.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/factures/${invoice.id}/imprimer`} target="_blank">
            <Button variant="outline" size="sm">
              <Printer /> Imprimer
            </Button>
          </Link>
          <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
            <Button variant="outline" size="sm">
              <Download /> PDF
            </Button>
          </Link>
          {["ADMIN", "COMPTABILITE"].includes(session.user.role) && (
            <SendInvoiceButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.number}
              clientEmail={invoice.client.email}
            />
          )}
          {["ADMIN", "COMPTABILITE"].includes(session.user.role) &&
            invoice.status !== "CANCELLED" && (
              <CreditNoteButton invoiceId={invoice.id} suggestedAmount={netDue} />
            )}
          <InvoiceActions
            id={invoice.id}
            currentStatus={invoice.status}
            paidAmount={Number(invoice.paidAmount)}
            totalTTC={computed.totalTTC}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[11.5px] font-medium text-[var(--color-fg-3)]">
                  <th className="text-left px-5 py-2.5">Type</th>
                  <th className="text-left px-5 py-2.5">Description</th>
                  <th className="text-right px-5 py-2.5">Qté</th>
                  <th className="text-right px-5 py-2.5">PU HT</th>
                  <th className="text-right px-5 py-2.5">TVA</th>
                  <th className="text-right px-5 py-2.5">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => {
                  const lineHT = Number(it.quantity) * Number(it.unitPrice);
                  return (
                    <tr key={it.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-5 py-2.5">
                        <Badge tone={it.kind === "DEBOURS" ? "info" : "outline"}>
                          {INVOICE_ITEM_KIND_LABELS[it.kind]}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg)]">
                        {it.description}
                        {it.dossier && (
                          <span className="ml-2 font-mono text-[11px] text-[var(--color-fg-3)]">
                            · {it.dossier.number}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg-3)]">
                        {Number(it.quantity)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum">
                        {formatMAD(Number(it.unitPrice))}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg-3)]">
                        {Number(it.vatRate)}%
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg)]">
                        {formatMAD(lineHT)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <div className="px-5 py-4 space-y-2 text-[13px]">
            <Row label="Total Non Taxable" value={formatMAD(computed.totalNonTaxable)} />
            <Row label="Total Taxable" value={formatMAD(computed.totalTaxable)} />
            {computed.vatByRate.map((v) => (
              <Row key={v.rate} label={`TVA ${v.rate} %`} value={formatMAD(v.amount)} />
            ))}
          </div>
          {/* Bloc TTC mis en avant */}
          <div className="px-5 py-3 bg-[var(--color-surface-2)] border-t border-b border-[var(--color-border)]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] text-[var(--color-fg-3)] font-medium">
                Total TTC
              </span>
              <span className="text-[22px] font-mono font-semibold tnum tracking-tight text-[var(--color-fg)]">
                {formatMAD(computed.totalTTC)}
              </span>
            </div>
          </div>
          {totalCredits > 0 && (
            <div className="px-5 py-3 space-y-2 text-[13px] border-b border-[var(--color-border)]">
              <Row
                label="Avoirs"
                value={`− ${formatMAD(totalCredits)}`}
                className="text-[var(--color-success)]"
              />
              <Row label="Net à payer" value={formatMAD(netDue)} bold />
            </div>
          )}
          {Number(invoice.paidAmount) > 0 && (
            <div className="px-5 py-3 space-y-2 text-[13px] border-b border-[var(--color-border)]">
              <Row
                label="Réglé"
                value={formatMAD(Number(invoice.paidAmount))}
                className="text-[var(--color-success)]"
              />
              {Number(invoice.paidAmount) < computed.totalTTC && (
                <Row
                  label="Reste dû"
                  value={formatMAD(computed.totalTTC - Number(invoice.paidAmount))}
                  className="text-[var(--color-warning)]"
                />
              )}
            </div>
          )}
          {(invoice.dueAt || invoice.termsOfPayment) && (
            <div className="px-5 py-3 border-t border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)] space-y-1">
              {invoice.dueAt && (
                <div>
                  Échéance :{" "}
                  <span className="text-[var(--color-fg-2)]">{formatDate(invoice.dueAt)}</span>
                </div>
              )}
              {invoice.termsOfPayment && (
                <div>
                  Conditions :{" "}
                  <span className="text-[var(--color-fg-2)]">{invoice.termsOfPayment}</span>
                </div>
              )}
              {invoice.paymentMethod && (
                <div>
                  Paiement :{" "}
                  <span className="text-[var(--color-fg-2)]">
                    {PAYMENT_METHOD_LABELS[invoice.paymentMethod]}
                    {invoice.paymentRef && ` (${invoice.paymentRef})`}
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {invoice.creditNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avoirs</CardTitle>
          </CardHeader>
          <div className="divide-y divide-[var(--color-border)]">
            {invoice.creditNotes.map((cn) => (
              <div
                key={cn.id}
                className="px-5 py-3 flex items-center justify-between gap-3 text-[13px]"
              >
                <div className="min-w-0">
                  <span className="font-mono font-medium text-[var(--color-fg)]">{cn.number}</span>
                  {cn.reason && (
                    <span className="ml-2 text-[var(--color-fg-3)]">{cn.reason}</span>
                  )}
                  <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                    {formatDate(cn.issuedAt)} · {CREDIT_NOTE_STATUS_LABELS[cn.status]}
                  </div>
                </div>
                <span className="font-mono tnum text-[var(--color-fg)]">
                  {formatMAD(Number(cn.amount))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <div className="px-5 py-4 text-[13px] whitespace-pre-wrap text-[var(--color-fg-2)]">
            {invoice.notes}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "text-[var(--color-fg)]" : "text-[var(--color-fg-3)]"}>{label}</span>
      <span className={`font-mono tnum ${className ?? ""}`}>{value}</span>
    </div>
  );
}
