import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canNotifyClient } from "@/lib/roles";
import { notifyClient } from "@/lib/messaging-server";
import { audit } from "@/lib/audit";
import type { TemplateKey } from "@/lib/messaging";

const schema = z.object({
  templateKey: z.string().min(1),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  lang: z.enum(["FR", "AR", "EN"]).default("FR"),
  customSubject: z.string().optional(),
  customBody: z.string().optional(),
  // destinataire choisi (sinon contact principal du client)
  toAddress: z.string().email().optional(),
  // enregistrer ce destinataire dans le carnet du client
  saveAsContact: z.boolean().optional(),
  contactName: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canNotifyClient(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

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

  // Email envoyé : mémoriser le destinataire sur le dossier + carnet client si demandé
  const to = parsed.data.toAddress;
  if (parsed.data.channel === "EMAIL" && to) {
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      select: { clientId: true },
    });
    await prisma.dossier.update({ where: { id }, data: { contactEmail: to } }).catch(() => {});
    if (parsed.data.saveAsContact && dossier) {
      await prisma.clientContact
        .upsert({
          where: { clientId_email: { clientId: dossier.clientId, email: to } },
          create: { clientId: dossier.clientId, email: to, name: parsed.data.contactName?.trim() || null },
          update: { name: parsed.data.contactName?.trim() || undefined },
        })
        .catch(() => {});
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
