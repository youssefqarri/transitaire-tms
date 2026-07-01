import "server-only";
import { prisma } from "./db";
import { sendPlatformMail, textToHtml } from "./mail";
import { sendWhatsApp, isWhatsAppConfigured } from "./whatsapp";
import { getPlatformBilling, subTotals } from "./subscription-billing";
import { formatMAD } from "./invoicing";

export type DeliverResult = { email: boolean; whatsapp: boolean; notif: boolean; errors: string[] };

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR");
}

async function loadInvoice(id: string) {
  return prisma.subscriptionInvoice.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          plan: true,
          organization: {
            include: { users: { where: { role: "ADMIN", active: true }, select: { email: true } } },
          },
        },
      },
    },
  });
}

type LoadedInvoice = NonNullable<Awaited<ReturnType<typeof loadInvoice>>>;

// Corps commun (texte) d'un email/WhatsApp de facture ou de relance.
function buildMessage(inv: LoadedInvoice, issuerName: string, ttc: number, reminder: boolean) {
  const org = inv.subscription.organization;
  const label = inv.label ?? `Abonnement ${inv.subscription.plan?.name ?? ""}`;
  const num = inv.number ?? "";
  const subject = reminder
    ? `Rappel — facture d'abonnement ${num} impayée`
    : `Facture d'abonnement ${num}`;
  const intro = reminder
    ? `Sauf erreur de notre part, la facture ${num} reste impayée à ce jour.`
    : `Veuillez trouver ci-joint votre facture d'abonnement.`;
  const text = [
    `Bonjour ${org.name},`,
    "",
    intro,
    "",
    `• Facture : ${num}`,
    `• Objet : ${label}`,
    `• Montant TTC : ${formatMAD(ttc)}`,
    `• Échéance : ${fmtDate(inv.dueAt)}`,
    "",
    reminder
      ? `Merci de bien vouloir procéder à son règlement dans les meilleurs délais.`
      : `Le règlement est à effectuer par virement, en rappelant la référence ${num}.`,
    "",
    `Cordialement,`,
    issuerName,
  ].join("\n");
  return { subject, text };
}

// Envoie/relance une facture d'abonnement au cabinet : email (+ PDF si fourni),
// WhatsApp, et notification in-app aux administrateurs du cabinet. Chaque canal est
// indépendant : un échec n'empêche pas les autres.
export async function deliverSubscriptionInvoice(opts: {
  invoiceId: string;
  reminder: boolean;
  pdf?: Buffer | null;
}): Promise<DeliverResult> {
  const inv = await loadInvoice(opts.invoiceId);
  const res: DeliverResult = { email: false, whatsapp: false, notif: false, errors: [] };
  if (!inv) {
    res.errors.push("Facture introuvable");
    return res;
  }

  const org = inv.subscription.organization;
  const issuer = await getPlatformBilling();
  const issuerName = issuer.name ?? "Escale";
  const { ttc } = subTotals(Number(inv.amount), Number(inv.vatRate));
  const { subject, text } = buildMessage(inv, issuerName, ttc, opts.reminder);

  // 1) Email → email du cabinet, sinon 1er admin actif.
  const to = org.email || org.users[0]?.email || null;
  if (to) {
    try {
      await sendPlatformMail({
        to,
        subject,
        text,
        html: textToHtml(text),
        replyTo: issuer.email ?? undefined,
        attachments: opts.pdf
          ? [{ filename: `facture-${inv.number ?? inv.id}.pdf`, content: opts.pdf, contentType: "application/pdf" }]
          : undefined,
      });
      res.email = true;
    } catch (e) {
      res.errors.push(`Email : ${(e as Error).message}`);
    }
  } else {
    res.errors.push("Email : aucun destinataire (renseigne l'email du cabinet)");
  }

  // 2) WhatsApp → téléphone du cabinet (si configuré).
  if (org.phone && (await isWhatsAppConfigured())) {
    try {
      await sendWhatsApp({ to: org.phone, text });
      res.whatsapp = true;
    } catch (e) {
      res.errors.push(`WhatsApp : ${(e as Error).message}`);
    }
  }

  // 3) Notification in-app → administrateurs du cabinet.
  try {
    await prisma.notification.create({
      data: {
        orgId: org.id,
        role: "ADMIN",
        kind: "AUTRE",
        title: opts.reminder ? `Rappel — facture ${inv.number} impayée` : `Facture ${inv.number}`,
        body: `${inv.label ?? "Abonnement"} — ${formatMAD(ttc)} TTC, échéance ${fmtDate(inv.dueAt)}.`,
        emailSent: res.email,
      },
    });
    res.notif = true;
  } catch (e) {
    res.errors.push(`Notification : ${(e as Error).message}`);
  }

  return res;
}
