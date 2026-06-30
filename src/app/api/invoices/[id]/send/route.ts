import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail, textToHtml } from "@/lib/mail";
import { audit } from "@/lib/audit";
import { orgScope, orgData } from "@/lib/tenant";
import { formatMAD, totals } from "@/lib/invoicing";
import { getIssuer } from "@/lib/invoicing-server";
import { storage } from "@/lib/storage";

const schema = z.object({
  to: z.string().email().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  // ids des documents (du dossier lié) à joindre à l'email — demande cliente
  documentIds: z.array(z.string()).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Seuls ADMIN et COMPTABILITE peuvent envoyer une facture par email
  if (!["ADMIN", "COMPTABILITE"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invoice = await prisma.invoice.findFirst({
    where: { ...orgScope(session.user.orgId), id },
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

  const issuer = await getIssuer();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://app.escale.ma";
  const printUrl = `${baseUrl}/factures/${invoice.id}/imprimer`;

  const subject =
    parsed.data.subject?.trim() ||
    `Facture ${invoice.number} — ${issuer.name}`;

  const defaultBody = `Bonjour,

Veuillez trouver ci-joint les détails de votre facture ${invoice.number} :

Montant TTC : ${formatMAD(computed.totalTTC)}

Vous pouvez consulter et imprimer la facture détaillée à l'adresse suivante :
${printUrl}

N'hésitez pas à nous contacter pour toute question.

Cordialement,
${issuer.name}`;

  const body = parsed.data.body?.trim() || defaultBody;

  // Pièces jointes : documents du dossier lié, sélectionnés par l'utilisateur (demande
  // cliente). Strictement bornés au dossier de CETTE facture ET à l'organisation.
  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
  if (parsed.data.documentIds?.length && invoice.dossierId) {
    const docs = await prisma.document.findMany({
      where: {
        id: { in: parsed.data.documentIds },
        dossierId: invoice.dossierId,
        deletedAt: null,
        dossier: { ...orgScope(session.user.orgId) },
      },
      select: { name: true, fileUrl: true, mimeType: true, dossierId: true },
    });
    const driver = await storage();
    for (const d of docs) {
      const orig = d.fileUrl?.split("/").pop();
      if (!orig) continue;
      const obj = await driver.get(`${d.dossierId}/${orig}`).catch(() => null);
      if (!obj) continue;
      const ext = orig.includes(".") ? orig.slice(orig.lastIndexOf(".")) : "";
      const filename =
        ext && !d.name.toLowerCase().endsWith(ext.toLowerCase()) ? `${d.name}${ext}` : d.name;
      attachments.push({ filename, content: obj.body, contentType: d.mimeType ?? undefined });
    }
  }

  // 1) Envoi de l'e-mail. S'il échoue, l'e-mail n'est pas parti → vrai échec :
  //    l'utilisateur peut réessayer sans risque de doublon.
  let result: { messageId: string };
  try {
    result = await sendMail({ to, subject, text: body, html: textToHtml(body), attachments });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "Échec de l'envoi" }, { status: 500 });
  }

  // 2) L'e-mail est parti : maj du statut (brouillon → envoyé) + trace, de façon
  //    ATOMIQUE. Si cette partie échoue, l'e-mail est déjà envoyé → on journalise
  //    mais on ne renvoie PAS d'échec (sinon l'utilisateur renverrait un doublon).
  const firstDossierId = invoice.items.find((it) => it.dossierId)?.dossierId;
  try {
    await prisma.$transaction(async (tx) => {
      if (invoice.status === "DRAFT") {
        await tx.invoice.update({
          where: { id },
          data: { status: "SENT", issuedAt: invoice.issuedAt ?? new Date() },
        });
      }
      if (firstDossierId) {
        await tx.outgoingMessage.create({
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
    });
  } catch (e) {
    console.error(`Facture ${invoice.number} envoyée mais maj statut/trace échouée:`, e);
  }

  await audit({
    userId: session.user.id,
    action: "SEND_INVOICE_EMAIL",
    entity: "Invoice",
    entityId: id,
    metadata: { to, subject, messageId: result.messageId },
    orgId: session.user.orgId,
  });

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
