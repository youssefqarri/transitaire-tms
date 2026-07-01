import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";
import { renderSubscriptionInvoicePdf } from "@/lib/subscription-pdf";
import { deliverSubscriptionInvoice } from "@/lib/subscription-notify";

// Envoie une facture d'abonnement au cabinet (email + PDF, WhatsApp, notif in-app).
// `reminder=true` (query) → relance manuelle (incrémente le compteur de relances).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const inv = await prisma.subscriptionInvoice.findUnique({ where: { id }, select: { id: true, orgId: true } });
  if (!inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const reminder = new URL(req.url).searchParams.get("reminder") === "1";
  const body = (await req.json().catch(() => ({}))) as {
    subject?: string;
    body?: string;
    to?: string;
    channels?: { email?: boolean; whatsapp?: boolean; notif?: boolean };
  };
  const channels = body.channels ?? { email: true, whatsapp: true, notif: true };
  // On ne rend le PDF que si l'email part (rendu Puppeteer coûteux).
  const pdf = channels.email
    ? await renderSubscriptionInvoicePdf(id, req.headers.get("cookie") ?? "")
    : null;
  const result = await deliverSubscriptionInvoice({
    invoiceId: id,
    reminder,
    pdf,
    subject: body.subject,
    body: body.body,
    to: body.to,
    channels,
  });

  if (reminder) {
    await prisma.subscriptionInvoice.update({
      where: { id },
      data: { remindersSent: { increment: 1 }, lastReminderAt: new Date() },
    });
  }

  await audit({
    userId: session.user.id,
    action: reminder ? "REMIND_SUBSCRIPTION_INVOICE" : "SEND_SUBSCRIPTION_INVOICE",
    entity: "SubscriptionInvoice",
    entityId: id,
    metadata: { orgId: inv.orgId, ...result },
    orgId: inv.orgId,
  });

  const anyOk = result.email || result.whatsapp || result.notif;
  return NextResponse.json(
    { ...result, ok: anyOk },
    { status: anyOk ? 200 : 502 },
  );
}
