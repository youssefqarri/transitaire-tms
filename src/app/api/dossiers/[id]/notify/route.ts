import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canNotifyClient } from "@/lib/roles";
import { notifyClient } from "@/lib/messaging-server";
import { audit } from "@/lib/audit";
import type { TemplateKey } from "@/lib/messaging";

const schema = z
  .object({
    templateKey: z.string().min(1),
    channel: z.enum(["EMAIL", "WHATSAPP"]),
    lang: z.enum(["FR", "AR", "EN"]).default("FR"),
    customSubject: z.string().optional(),
    customBody: z.string().optional(),
    // destinataire choisi (email pour EMAIL, téléphone pour WHATSAPP ; sinon contact principal)
    toAddress: z.string().optional(),
    // enregistrer ce destinataire dans le carnet du client
    saveAsContact: z.boolean().optional(),
    contactName: z.string().optional(),
  })
  // Validation du destinataire selon le canal : un e-mail / numéro mal saisi ne doit
  // pas partir puis échouer côté serveur — on renvoie un message clair.
  .superRefine((data, ctx) => {
    const v = data.toAddress?.trim();
    if (!v) return; // pas de destinataire explicite → contact principal du dossier
    if (data.channel === "EMAIL") {
      // toAddress peut contenir PLUSIEURS adresses séparées par « , » ou « ; »
      const emails = v.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      if (emails.length === 0 || emails.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toAddress"], message: "Adresse e-mail invalide" });
      }
    }
    if (data.channel === "WHATSAPP" && !/^[0-9+()\s-]{6,20}$/.test(v)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toAddress"], message: "Numéro de téléphone invalide" });
    }
  });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canNotifyClient(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides" },
      { status: 400 },
    );

  const result = await notifyClient({
    dossierId: id,
    templateKey: parsed.data.templateKey as TemplateKey,
    channel: parsed.data.channel,
    lang: parsed.data.lang,
    userId: session.user.id,
    customSubject: parsed.data.customSubject,
    customBody: parsed.data.customBody,
    toAddress: parsed.data.toAddress,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Email envoyé : mémoriser le 1er destinataire sur le dossier + carnet client si demandé.
  // toAddress peut contenir plusieurs adresses (séparées par « , »/« ; »).
  const to = parsed.data.toAddress;
  if (parsed.data.channel === "EMAIL" && to) {
    const emails = to.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      select: { clientId: true },
    });
    if (emails[0])
      await prisma.dossier.update({ where: { id }, data: { contactEmail: emails[0] } }).catch(() => {});
    if (parsed.data.saveAsContact && dossier) {
      for (const email of emails) {
        await prisma.clientContact
          .upsert({
            where: { clientId_email: { clientId: dossier.clientId, email } },
            create: { clientId: dossier.clientId, email, name: null },
            update: {},
          })
          .catch(() => {});
      }
    }
  }

  await audit({
    userId: session.user.id,
    action: "NOTIFY_CLIENT",
    entity: "Dossier",
    entityId: id,
    metadata: {
      templateKey: parsed.data.templateKey,
      channel: parsed.data.channel,
    },
  });

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
