import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";
import { recomputeInvoicePaid } from "@/lib/subscription-billing";

const schema = z.object({
  amount: z.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  date: z.string().optional(), // yyyy-mm-dd
  note: z.string().max(500).optional(),
});

// Enregistre un encaissement (ligne du registre) sur une facture d'abonnement.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const inv = await prisma.subscriptionInvoice.findUnique({ where: { id: invoiceId }, select: { orgId: true } });
  if (!inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const d = parsed.data;

  const payment = await prisma.subscriptionPayment.create({
    data: {
      invoiceId,
      amount: d.amount,
      method: d.method || null,
      reference: d.reference || null,
      paidAt: d.date ? new Date(d.date) : new Date(),
      note: d.note || null,
      createdById: session.user.id,
    },
  });
  await recomputeInvoicePaid(invoiceId);

  await audit({
    userId: session.user.id,
    action: "CREATE_SUBSCRIPTION_PAYMENT",
    entity: "SubscriptionPayment",
    entityId: payment.id,
    metadata: { orgId: inv.orgId, invoiceId, amount: d.amount },
    orgId: inv.orgId,
  });
  return NextResponse.json({ id: payment.id });
}
