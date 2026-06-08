import "server-only";
import { prisma } from "./db";
import { loadTemplate, renderTemplate, type TemplateKey } from "./messaging";
import { sendMail, textToHtml } from "./mail";
import type { MessageChannel, MessageLang } from "@/generated/prisma/enums";

export type NotifyResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Envoie une notification au client via le canal et la langue choisis.
 * - Charge le template (DB ou défaut)
 * - Remplit les variables {{client.name}}, {{dossier.number}}, etc.
 * - Envoie (EMAIL only pour l'instant — WhatsApp en attente du Cloud API)
 * - Crée un OutgoingMessage pour audit
 */
export async function notifyClient(opts: {
  dossierId: string;
  templateKey: TemplateKey;
  channel: MessageChannel;
  lang?: MessageLang;
  userId: string;
  customSubject?: string;
  customBody?: string;
  extraVars?: Record<string, string>;
  /** Destinataire explicite (sinon : email/téléphone principal du client). */
  toAddress?: string;
}): Promise<NotifyResult> {
  const dossier = await prisma.dossier.findUnique({
    where: { id: opts.dossierId },
    include: { client: true, dums: true },
  });
  if (!dossier) return { ok: false, error: "Dossier introuvable" };

  // Destinataire : adresse choisie explicitement, sinon contact principal du client.
  const recipient =
    opts.channel === "EMAIL"
      ? (opts.toAddress?.trim() || dossier.client.email)
      : (opts.toAddress?.trim() || dossier.client.phone || "");
  if (opts.channel === "EMAIL" && !recipient) {
    return { ok: false, error: "Aucun destinataire : renseigne un email pour ce client." };
  }

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { name: true },
  });

  // 1. Charger template + appliquer variables
  const template = await loadTemplate(
    opts.templateKey,
    opts.channel,
    opts.lang ?? "FR",
  );
  const vars: Record<string, string | number | undefined | null> = {
    "client.name": dossier.client.name,
    "client.contactName": dossier.client.contactName ?? dossier.client.name,
    "dossier.number": dossier.number,
    "dossier.reference": dossier.reference ?? "",
    "user.name": user?.name ?? "",
    "dum.number": dossier.dums[0]?.number ?? "",
    "visitDate": dossier.visitDate
      ? new Intl.DateTimeFormat("fr-FR").format(dossier.visitDate)
      : "",
    portalUrl: process.env.AUTH_URL ?? "http://localhost:3000",
    ...opts.extraVars,
  };

  const subject =
    opts.customSubject ??
    (template.subject ? renderTemplate(template.subject, vars) : null);
  const body = opts.customBody ?? renderTemplate(template.body, vars);

  // 2. Crée le OutgoingMessage en PENDING d'abord
  const msg = await prisma.outgoingMessage.create({
    data: {
      channel: opts.channel,
      lang: opts.lang ?? "FR",
      templateKey: opts.templateKey,
      toAddress: recipient ?? "",
      subject,
      body,
      status: "PENDING",
      dossierId: opts.dossierId,
      clientId: dossier.clientId,
      sentById: opts.userId,
    },
  });

  // 3. Envoyer
  try {
    if (opts.channel === "EMAIL") {
      const result = await sendMail({
        to: recipient!,
        subject: subject ?? `Dossier ${dossier.number}`,
        text: body,
        html: textToHtml(body),
      });
      await prisma.outgoingMessage.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          externalId: result.messageId,
        },
      });
      return { ok: true, messageId: result.messageId };
    }

    // WhatsApp : pas encore branché (Cloud API à venir)
    await prisma.outgoingMessage.update({
      where: { id: msg.id },
      data: { status: "FAILED", error: "WhatsApp Cloud API non configuré" },
    });
    return { ok: false, error: "WhatsApp non disponible (Cloud API requis)" };
  } catch (e: unknown) {
    const err = (e as Error).message;
    await prisma.outgoingMessage.update({
      where: { id: msg.id },
      data: { status: "FAILED", error: err },
    });
    return { ok: false, error: err };
  }
}
