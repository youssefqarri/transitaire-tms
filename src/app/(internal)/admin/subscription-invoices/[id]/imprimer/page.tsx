import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { formatMAD, montantEnLettres } from "@/lib/invoicing";
import { getPlatformBilling, subTotals } from "@/lib/subscription-billing";
import { formatDate } from "@/lib/utils";
import { PrintTrigger } from "./print-trigger";

export const dynamic = "force-dynamic";

export default async function SubscriptionInvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;
  if (!isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true, organization: true } },
    },
  });
  if (!invoice) notFound();

  const issuer = await getPlatformBilling();
  const org = invoice.subscription.organization;
  const vatRate = Number(invoice.vatRate);
  const t = subTotals(Number(invoice.amount), vatRate);
  const label =
    invoice.label ??
    `Abonnement ${invoice.subscription.plan?.name ?? ""} — ${formatDate(invoice.periodStart)} à ${formatDate(invoice.periodEnd)}`;

  return (
    <>
      <style>{`
        @media screen { body { background: #f6f6f6; } }
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        .invoice-page {
          width: 210mm; min-height: 297mm; padding: 18mm 16mm; margin: 24px auto;
          background: white; color: #1a1a1a;
          font-family: var(--font-geist), system-ui, sans-serif;
          box-shadow: 0 2px 12px rgba(0,0,0,.05);
        }
        @media print { .invoice-page { margin: 0; box-shadow: none; padding: 0; } }
        .invoice-page h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
        .invoice-page table { width: 100%; border-collapse: collapse; }
        .invoice-page th, .invoice-page td { padding: 8px 6px; border-bottom: 1px solid #e6e6e6; font-size: 11.5px; }
        .invoice-page th { text-align: left; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9.5px; color: #555; font-weight: 600; border-bottom: 1px solid #aaa; }
        .invoice-page .tnum { font-variant-numeric: tabular-nums; }
      `}</style>

      <div
        className="no-print"
        style={{ width: "210mm", maxWidth: "100%", margin: "24px auto 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <a
          href={`/admin/${org.id}`}
          style={{ fontSize: 13, color: "#555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          ← Retour au cabinet
        </a>
        <PrintTrigger />
      </div>

      <div className="invoice-page">
        {/* En-tête émetteur (plateforme) */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1>{issuer.name ?? "—"} {issuer.legalForm ?? ""}</h1>
            <div style={{ fontSize: 11.5, color: "#555", marginTop: 6, lineHeight: 1.6 }}>
              {issuer.address}
              {issuer.city ? `, ${issuer.city}` : ""}
              <br />
              {issuer.ice && `ICE ${issuer.ice}`}
              {issuer.taxId && ` • IF ${issuer.taxId}`}
              {issuer.rc && ` • RC ${issuer.rc}`}
              <br />
              {issuer.patente && `Patente ${issuer.patente}`}
              {issuer.cnss && ` • CNSS ${issuer.cnss}`}
              <br />
              {issuer.phone}
              {issuer.email && ` • ${issuer.email}`}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              Facture
            </div>
            <div style={{ fontSize: 24, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
              {invoice.number ?? "—"}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 8, lineHeight: 1.6 }}>
              Émise le : <strong>{formatDate(invoice.createdAt) || "—"}</strong>
              <br />
              Échéance : <strong>{formatDate(invoice.dueAt) || "—"}</strong>
            </div>
          </div>
        </div>

        {/* Bloc destinataire (cabinet) */}
        <div style={{ border: "1px solid #e6e6e6", padding: 14, borderRadius: 4, marginBottom: 24 }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#777", marginBottom: 6 }}>
            Facturé à
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{org.name}</div>
          <div style={{ fontSize: 11.5, color: "#555", marginTop: 4, lineHeight: 1.6 }}>
            {org.address && (
              <>
                {org.address}
                {org.city && `, ${org.city}`}
                <br />
              </>
            )}
            {org.ice && `ICE ${org.ice}`}
            {org.rc && ` • RC ${org.rc}`}
            {org.taxId && ` • IF ${org.taxId}`}
          </div>
        </div>

        {/* Ligne */}
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ textAlign: "right" }}>TVA %</th>
              <th style={{ textAlign: "right" }}>Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{label}</td>
              <td className="tnum" style={{ textAlign: "right" }}>{vatRate} %</td>
              <td className="tnum" style={{ textAlign: "right" }}>{formatMAD(t.ht)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <table style={{ width: 300 }}>
            <tbody>
              <tr>
                <td style={{ color: "#555" }}>Total HT</td>
                <td className="tnum" style={{ textAlign: "right" }}>{formatMAD(t.ht)}</td>
              </tr>
              <tr>
                <td style={{ color: "#555" }}>TVA {vatRate} %</td>
                <td className="tnum" style={{ textAlign: "right" }}>{formatMAD(t.vat)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 13, borderTop: "2px solid #111" }}>Total TTC</td>
                <td className="tnum" style={{ textAlign: "right", fontWeight: 700, fontSize: 13, borderTop: "2px solid #111" }}>
                  {formatMAD(t.ttc)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: "#555", fontStyle: "italic" }}>
          Arrêtée la présente facture à la somme de :{" "}
          <strong style={{ color: "#1a1a1a", fontStyle: "normal" }}>{montantEnLettres(t.ttc)}</strong>.
        </div>

        {(issuer.bank || issuer.rib || issuer.invoiceFooter) && (
          <div style={{ marginTop: 24, padding: 14, background: "#fafafa", border: "1px solid #eee", borderRadius: 4, fontSize: 11, color: "#555", lineHeight: 1.6 }}>
            {(issuer.bank || issuer.rib) && (
              <div>
                <strong>Virement :</strong> {issuer.bank}
                {issuer.rib && ` • RIB ${issuer.rib}`}
                {issuer.swift && ` • SWIFT ${issuer.swift}`}
              </div>
            )}
            {invoice.number && (
              <div style={{ marginTop: 4 }}>
                <strong>Référence à rappeler :</strong> {invoice.number}
              </div>
            )}
            {issuer.invoiceFooter && <div style={{ marginTop: 6 }}>{issuer.invoiceFooter}</div>}
          </div>
        )}

        <div style={{ marginTop: 36, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888" }}>
          <span>
            {issuer.name} {issuer.legalForm}
            {issuer.ice && ` • ICE ${issuer.ice}`}
          </span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </>
  );
}
