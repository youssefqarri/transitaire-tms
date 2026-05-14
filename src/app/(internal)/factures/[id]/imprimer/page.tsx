import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  ISSUER,
  INVOICE_ITEM_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  formatMAD,
  totals,
  montantEnLettres,
} from "@/lib/invoicing";
import { formatDate } from "@/lib/utils";
import { PrintTrigger } from "./print-trigger";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, items: { orderBy: { order: "asc" } } },
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
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 16mm;
          margin: 24px auto;
          background: white;
          color: #1a1a1a;
          font-family: var(--font-geist), system-ui, sans-serif;
          box-shadow: 0 2px 12px rgba(0,0,0,.05);
        }
        @media print { .invoice-page { margin: 0; box-shadow: none; padding: 0; } }
        .invoice-page h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
        .invoice-page table { width: 100%; border-collapse: collapse; }
        .invoice-page th, .invoice-page td { padding: 8px 6px; border-bottom: 1px solid #e6e6e6; font-size: 11.5px; }
        .invoice-page th { text-align: left; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9.5px; color: #555; font-weight: 600; border-bottom: 1px solid #aaa; }
        .invoice-page .tnum { font-variant-numeric: tabular-nums; font-family: var(--font-geist-mono), monospace; }
      `}</style>

      <div className="invoice-page">
        <div className="no-print" style={{ textAlign: "right", marginBottom: 24 }}>
          <PrintTrigger />
        </div>

        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1>{ISSUER.name}</h1>
            <div style={{ fontSize: 11.5, color: "#555", marginTop: 6, lineHeight: 1.6 }}>
              {ISSUER.address}
              <br />
              ICE {ISSUER.ice} · RC {ISSUER.rc} · IF {ISSUER.taxId} · CNSS {ISSUER.cnss}
              <br />
              {ISSUER.phone} · {ISSUER.email}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#777",
                marginBottom: 6,
              }}
            >
              Facture
            </div>
            <div style={{ fontSize: 24, fontFamily: "var(--font-geist-mono), monospace", fontWeight: 600 }}>
              {invoice.number}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 8, lineHeight: 1.6 }}>
              Émise le : <strong>{formatDate(invoice.issuedAt) || "—"}</strong>
              <br />
              Échéance : <strong>{formatDate(invoice.dueAt) || "—"}</strong>
            </div>
          </div>
        </div>

        {/* Bloc client */}
        <div
          style={{
            border: "1px solid #e6e6e6",
            padding: 14,
            borderRadius: 4,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#777",
              marginBottom: 6,
            }}
          >
            Facturé à
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{invoice.client.name}</div>
          <div style={{ fontSize: 11.5, color: "#555", marginTop: 4, lineHeight: 1.6 }}>
            {invoice.client.address && (
              <>
                {invoice.client.address}
                {invoice.client.city && `, ${invoice.client.city}`}
                <br />
              </>
            )}
            {invoice.client.ice && `ICE ${invoice.client.ice}`}
            {invoice.client.rc && ` · RC ${invoice.client.rc}`}
            {invoice.client.taxId && ` · IF ${invoice.client.taxId}`}
          </div>
        </div>

        {/* Lignes */}
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Désignation</th>
              <th style={{ textAlign: "right" }}>Qté</th>
              <th style={{ textAlign: "right" }}>PU HT</th>
              <th style={{ textAlign: "right" }}>TVA</th>
              <th style={{ textAlign: "right" }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => {
              const lineHT = Number(it.quantity) * Number(it.unitPrice);
              return (
                <tr key={it.id}>
                  <td>{INVOICE_ITEM_KIND_LABELS[it.kind]}</td>
                  <td>{it.description}</td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {Number(it.quantity)}
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {formatMAD(Number(it.unitPrice))}
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {Number(it.vatRate)}%
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {formatMAD(lineHT)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <table style={{ width: 280 }}>
            <tbody>
              <tr>
                <td style={{ color: "#555" }}>Total HT</td>
                <td className="tnum" style={{ textAlign: "right" }}>
                  {formatMAD(computed.totalHT)}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#555" }}>TVA</td>
                <td className="tnum" style={{ textAlign: "right" }}>
                  {formatMAD(computed.totalVAT)}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 13, borderTop: "2px solid #111" }}>
                  Total TTC
                </td>
                <td
                  className="tnum"
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: 13,
                    borderTop: "2px solid #111",
                  }}
                >
                  {formatMAD(computed.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: "#555", fontStyle: "italic" }}>
          Arrêtée la présente facture à la somme de :{" "}
          <strong style={{ color: "#1a1a1a", fontStyle: "normal" }}>
            {montantEnLettres(computed.totalTTC)}
          </strong>
          .
        </div>

        {(invoice.termsOfPayment || invoice.paymentMethod || invoice.notes) && (
          <div
            style={{
              marginTop: 24,
              padding: 14,
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: 4,
              fontSize: 11,
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            {invoice.termsOfPayment && (
              <div>
                <strong>Conditions :</strong> {invoice.termsOfPayment}
              </div>
            )}
            {invoice.paymentMethod && (
              <div>
                <strong>Mode :</strong> {PAYMENT_METHOD_LABELS[invoice.paymentMethod]}
                {invoice.paymentRef && ` — ${invoice.paymentRef}`}
              </div>
            )}
            {invoice.notes && (
              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{invoice.notes}</div>
            )}
            <div style={{ marginTop: 6 }}>
              <strong>Virement :</strong> {ISSUER.bank} · IBAN {ISSUER.iban}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 36,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "#888",
          }}
        >
          <span>
            {ISSUER.name} · ICE {ISSUER.ice}
          </span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </>
  );
}
