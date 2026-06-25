import "server-only";
import { prisma } from "./db";
import { loadTemplate, renderTemplate, type TemplateKey } from "./messaging";
import { sendMail, textToHtml } from "./mail";
import { sendWhatsApp, isWhatsAppConfigured } from "./whatsapp";
import { DOCUMENT_CATEGORY_LABELS } from "./statuses";
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
    include: {
      client: true,
      dums: true,
      // documents attendus non encore reçus → alimente {{missingList}}
      expectedDocuments: { where: { deletedAt: null, fulfilledAt: null }, orderBy: { createdAt: "asc" } },
    },
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
  // Référence(s) que le CLIENT reconnaît — suffixe « (réf. X — votre réf. Y) »,
  // vide si aucune référence. Indispensable pour qu'il sache de quel dossier il s'agit.
  const refParts: string[] = [];
  if (dossier.reference) refParts.push(`réf. ${dossier.reference}`);
  if (dossier.clientReference && dossier.clientReference !== dossier.reference)
    refParts.push(`votre réf. ${dossier.clientReference}`);

  const vars: Record<string, string | number | undefined | null> = {
    "client.name": dossier.client.name,
    "client.contactName": dossier.client.contactName ?? dossier.client.name,
    "dossier.number": dossier.number,
    "dossier.reference": dossier.reference ?? "",
    "dossier.clientReference": dossier.clientReference ?? "",
    "dossier.refSuffix": refParts.length ? ` (${refParts.join(" — ")})` : "",
    "user.name": user?.name ?? "",
    "dum.number": dossier.dums[0]?.number ?? "",
    "visitDate": dossier.visitDate
      ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca" }).format(dossier.visitDate)
      : "",
    missingList: dossier.expectedDocuments.length
      ? dossier.expectedDocuments
          .map((e) => `- ${e.name?.trim() || e.note?.trim() || DOCUMENT_CATEGORY_LABELS[e.category]}`)
          .join("\n")
      : "- (à préciser)",
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

    // WhatsApp : envoi réel via l'API OpenWA/WAHA si configurée, sinon repli manuel (wa.me).
    if (await isWhatsAppConfigured()) {
      if (!recipient) {
        await prisma.outgoingMessage.update({
          where: { id: msg.id },
          data: { status: "FAILED", error: "Aucun numéro WhatsApp" },
        });
        return { ok: false, error: "Aucun numéro : renseigne un téléphone pour ce client." };
      }
      const result = await sendWhatsApp({ to: recipient, text: body });
      await prisma.outgoingMessage.update({
        where: { id: msg.id },
        data: { status: "SENT", sentAt: new Date(), externalId: result.messageId },
      });
      return { ok: true, messageId: result.messageId };
    }
    // Repli : envoi manuel via wa.me côté navigateur — on trace comme envoyé (manuel).
    await prisma.outgoingMessage.update({
      where: { id: msg.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { ok: true, messageId: msg.id };
  } catch (e: unknown) {
    const err = (e as Error).message;
    // Ne pas laisser un échec (rare) de cette mise à jour masquer l'erreur d'envoi
    // d'origine (éviterait un rejet de promesse non géré).
    await prisma.outgoingMessage
      .update({ where: { id: msg.id }, data: { status: "FAILED", error: err } })
      .catch(() => {});
    return { ok: false, error: err };
  }
}
