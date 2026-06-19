import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canViewInvoices } from "@/lib/roles";
import {
  PAYMENT_METHOD_LABELS,
  formatMAD,
  totals,
  montantEnLettres,
} from "@/lib/invoicing";
import { getIssuer } from "@/lib/invoicing-server";
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
  if (!canViewInvoices(session.user.role)) redirect("/dashboard");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { order: "asc" } },
      dossier: {
        include: {
          supplier: true,
          dums: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!invoice) notFound();

  const issuer = await getIssuer();

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
            <h1>{issuer.name} {issuer.legalForm}</h1>
            <div style={{ fontSize: 11.5, color: "#555", marginTop: 6, lineHeight: 1.6 }}>
              {issuer.address}
              <br />
              Agrément {issuer.agrement} · ICE {issuer.ice} · IF {issuer.taxId}
              <br />
              RC {issuer.rc} · Patente {issuer.patente} · CNSS {issuer.cnss}
              <br />
              {issuer.phone} · {issuer.email}
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

        {/* Bloc référence dossier */}
        {invoice.dossier && (
          <div
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 4,
              padding: 14,
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px 16px",
            }}
          >
            <RefField label="Dossier N°" value={invoice.dossier.number} />
            {invoice.dossier.reference && (
              <RefField label="Référence" value={invoice.dossier.reference} />
            )}
            {invoice.dossier.dums[0]?.number && (
              <RefField label="Déclaration N°" value={invoice.dossier.dums[0].number} />
            )}
            {invoice.dossier.declarationAt && (
              <RefField
                label="Déclaration le"
                value={formatDate(invoice.dossier.declarationAt) || "—"}
              />
            )}
            {invoice.dossier.supplier?.name && (
              <RefField label="Expéditeur" value={invoice.dossier.supplier.name} />
            )}
            <RefField label="Destinataire" value={invoice.client.name} />
            {invoice.dossier.goodsDescription && (
              <RefField label="Marchandise" value={invoice.dossier.goodsDescription} />
            )}
            {invoice.dossier.goodsPackages != null && (
              <RefField label="Colis" value={String(invoice.dossier.goodsPackages)} />
            )}
            {invoice.dossier.goodsWeight != null && (
              <RefField label="Poids brut" value={`${Number(invoice.dossier.goodsWeight)} kg`} />
            )}
            {invoice.dossier.goodsValue != null && (
              <RefField
                label="Valeur déclarée"
                value={`${Number(invoice.dossier.goodsValue)} ${invoice.dossier.goodsCurrency ?? ""}`.trim()}
              />
            )}
            {(invoice.dossier.dums[0]?.liquidatedDuties != null ||
              invoice.dossier.dums[0]?.estimatedDuties != null) && (
              <RefField
                label="Droits & taxes"
                value={formatMAD(
                  Number(
                    invoice.dossier.dums[0]?.liquidatedDuties ??
                      invoice.dossier.dums[0]?.estimatedDuties,
                  ),
                )}
              />
            )}
          </div>
        )}

        {/* Lignes — présentation Montant Taxable / Montant Non Taxable */}
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th style={{ textAlign: "right" }}>TVA %</th>
              <th style={{ textAlign: "right" }}>Montant Taxable</th>
              <th style={{ textAlign: "right" }}>Montant Non Taxable</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => {
              const lineHT = Number(it.quantity) * Number(it.unitPrice);
              const rate = Number(it.vatRate);
              const taxable = rate > 0;
              return (
                <tr key={it.id}>
                  <td className="tnum" style={{ whiteSpace: "nowrap" }}>{it.code ?? ""}</td>
                  <td>
                    {it.description}
                    {Number(it.quantity) !== 1 && (
                      <span style={{ color: "#888" }}>
                        {" "}
                        ({Number(it.quantity)} × {formatMAD(Number(it.unitPrice))})
                      </span>
                    )}
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {taxable ? `${rate}%` : "—"}
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {taxable ? formatMAD(lineHT) : ""}
                  </td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {taxable ? "" : formatMAD(lineHT)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <table style={{ width: 300 }}>
            <tbody>
              <tr>
                <td style={{ color: "#555" }}>Total Non Taxable</td>
                <td className="tnum" style={{ textAlign: "right" }}>
                  {formatMAD(computed.totalNonTaxable)}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#555" }}>Total Taxable</td>
                <td className="tnum" style={{ textAlign: "right" }}>
                  {formatMAD(computed.totalTaxable)}
                </td>
              </tr>
              {computed.vatByRate.map((v) => (
                <tr key={v.rate}>
                  <td style={{ color: "#555" }}>T.V.A {v.rate} %</td>
                  <td className="tnum" style={{ textAlign: "right" }}>
                    {formatMAD(v.amount)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ fontWeight: 700, fontSize: 13, borderTop: "2px solid #111" }}>
                  Montant T.T.C
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
              <strong>Virement :</strong> {issuer.bank} · RIB {issuer.rib} · SWIFT {issuer.swift}
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
            {issuer.name} {issuer.legalForm} · Agrément {issuer.agrement} · ICE {issuer.ice}
          </span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </>
  );
}

function RefField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 8.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#888",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#1a1a1a", marginTop: 1 }}>{value}</div>
    </div>
  );
}
