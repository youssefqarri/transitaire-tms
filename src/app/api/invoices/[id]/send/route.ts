import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, textToHtml } from "@/lib/mail";
import { audit } from "@/lib/audit";
import { formatMAD, totals, ISSUER } from "@/lib/invoicing";
import { orgData } from "@/lib/tenant";

const schema = z.object({
  to: z.string().email().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Seuls ADMIN et COMPTABILITE peuvent envoyer une facture par email
  if (!["ADMIN", "COMPTABILITE"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { order: "asc" } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  const to = (parsed.data.to ?? invoice.client.email ?? "").trim();
  if (!to) {
    return NextResponse.json(
      { error: "Aucune adresse email pour ce client. Renseignez-la dans la fiche client." },
      { status: 400 },
    );
  }

  const computed = totals(
    invoice.items.map((it) => ({
      kind: it.kind,
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      vatRate: Number(it.vatRate),
    })),
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://transit.evead.com";
  const printUrl = `${baseUrl}/factures/${invoice.id}/imprimer`;

  const subject =
    parsed.data.subject?.trim() ||
    `Facture ${invoice.number} — ${ISSUER.name}`;

  const defaultBody = `Bonjour,

Veuillez trouver ci-joint les détails de votre facture ${invoice.number} :

Montant TTC : ${formatMAD(computed.totalTTC)}

Vous pouvez consulter et imprimer la facture détaillée à l'adresse suivante :
${printUrl}

N'hésitez pas à nous contacter pour toute question.

Cordialement,
${ISSUER.name}`;

  const body = parsed.data.body?.trim() || defaultBody;

  try {
    const result = await sendMail({
      to,
      subject,
      text: body,
      html: textToHtml(body),
    });

    // Marque la facture comme envoyée si elle était en brouillon
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id },
        data: { status: "SENT", issuedAt: invoice.issuedAt ?? new Date() },
      });
    }

    // Trace l'envoi dans OutgoingMessage si possible (lié au dossier de la première ligne)
    const firstDossierId = invoice.items.find((it) => it.dossierId)?.dossierId;
    if (firstDossierId) {
      await prisma.outgoingMessage.create({
        data: {
          ...orgData(session.user.orgId),
          dossierId: firstDossierId,
          channel: "EMAIL",
          lang: "FR",
          toAddress: to,
          subject,
          body,
          status: "SENT",
          sentAt: new Date(),
          sentById: session.user.id,
          clientId: invoice.clientId,
          templateKey: "INVOICE_SENT",
        },
      });
    }

    await audit({
      userId: session.user.id,
      action: "SEND_INVOICE_EMAIL",
      entity: "Invoice",
      entityId: id,
      metadata: { to, subject, messageId: result.messageId },
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      { error: err.message || "Échec de l'envoi" },
      { status: 500 },
    );
  }
}
