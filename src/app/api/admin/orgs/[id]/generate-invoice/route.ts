import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";
import { getPlatformBilling, nextSubInvoiceNumber } from "@/lib/subscription-billing";

const schema = z.object({
  amount: z.number().positive().optional(), // HT ; défaut = prix mensuel du plan
  label: z.string().trim().max(200).optional(),
  periodStart: z.string().optional(), // yyyy-mm-dd ; défaut = 1er du mois
  periodEnd: z.string().optional(),
  dueAt: z.string().optional(), // yyyy-mm-dd ; prioritaire sur dueInDays
  dueInDays: z.number().int().min(0).max(120).optional(), // défaut 15
  vatRate: z.number().min(0).max(100).optional(), // défaut 20
});

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// Génère une facture d'abonnement (frais du forfait) pour un cabinet. Émetteur =
// plateforme (Evead). `amount` est HT ; la TVA (défaut 20 %) est portée par vatRate.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sub = await prisma.subscription.findUnique({ where: { orgId }, include: { plan: true } });
  if (!sub) return NextResponse.json({ error: "Ce cabinet n'a pas d'abonnement." }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const d = parsed.data;

  const amount = d.amount ?? (sub.plan ? Number(sub.plan.price) : 0);
  if (!(amount > 0))
    return NextResponse.json(
      { error: "Montant introuvable : associe un plan ou saisis un montant." },
      { status: 400 },
    );

  const now = new Date();
  const periodStart = d.periodStart
    ? new Date(d.periodStart)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = d.periodEnd
    ? new Date(d.periodEnd)
    : new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
  const dueAt = d.dueAt ? new Date(d.dueAt) : new Date(now.getTime() + (d.dueInDays ?? 15) * 86400000);
  const label =
    d.label ??
    `Abonnement ${sub.plan?.name ?? ""} — ${MONTHS[periodStart.getMonth()]} ${periodStart.getFullYear()}`.trim();

  const billing = await getPlatformBilling();
  const year = periodStart.getFullYear();

  const inv = await prisma.$transaction(async (tx) => {
    const number = await nextSubInvoiceNumber(tx, billing.invoicePrefix, year);
    return tx.subscriptionInvoice.create({
      data: {
        subscriptionId: sub.id,
        orgId,
        number,
        label,
        amount,
        vatRate: d.vatRate ?? 20,
        periodStart,
        periodEnd,
        dueAt,
        status: "PENDING",
      },
    });
  });

  await audit({
    userId: session.user.id,
    action: "GENERATE_SUBSCRIPTION_INVOICE",
    entity: "SubscriptionInvoice",
    entityId: inv.id,
    metadata: { orgId, number: inv.number, amount },
    orgId,
  });
  return NextResponse.json({ id: inv.id, number: inv.number });
}
