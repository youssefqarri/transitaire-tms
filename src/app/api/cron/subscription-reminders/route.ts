import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { subTotals } from "@/lib/subscription-billing";
import { deliverSubscriptionInvoice } from "@/lib/subscription-notify";

// Jalons de relance : jours par rapport à l'échéance (négatif = avant, positif = après).
const MILESTONES = [-3, 1, 7, 15];
const DAY = 86400000;

function dayOffset(due: Date, now: Date): number {
  // Différence en jours calendaires (échéance − aujourd'hui), positif = échéance dépassée.
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((a - b) / DAY);
}

function sameDay(a: Date | null, b: Date): boolean {
  return a != null && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Relance automatique des factures d'abonnement impayées, aux jalons J-3/J+1/J+7/J+15.
// Auth : admin plateforme connecté OU en-tête x-cron-secret === CRON_SECRET.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bySecret = !!secret && req.headers.get("x-cron-secret") === secret;
  const session = await auth();
  const byAdmin = !!session && isPlatformAdmin(session.user.email);
  if (!bySecret && !byAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const invoices = await prisma.subscriptionInvoice.findMany({
    where: { status: { in: ["PENDING", "OVERDUE"] } },
    select: {
      id: true,
      amount: true,
      vatRate: true,
      paidAmount: true,
      dueAt: true,
      status: true,
      lastReminderAt: true,
    },
  });

  let reminded = 0;
  let markedOverdue = 0;
  const errors: string[] = [];

  for (const inv of invoices) {
    const { ttc } = subTotals(Number(inv.amount), Number(inv.vatRate));
    if (Number(inv.paidAmount) >= ttc) continue; // soldée (garde-fou)

    const offset = dayOffset(inv.dueAt, now);

    // Bascule en OVERDUE dès que l'échéance est dépassée.
    if (offset > 0 && inv.status === "PENDING") {
      await prisma.subscriptionInvoice.update({ where: { id: inv.id }, data: { status: "OVERDUE" } });
      markedOverdue++;
    }

    // Relance au jalon, une seule fois par jour.
    if (MILESTONES.includes(offset) && !sameDay(inv.lastReminderAt, now)) {
      try {
        await deliverSubscriptionInvoice({ invoiceId: inv.id, reminder: true, pdf: null });
        await prisma.subscriptionInvoice.update({
          where: { id: inv.id },
          data: { remindersSent: { increment: 1 }, lastReminderAt: now },
        });
        reminded++;
      } catch (e) {
        errors.push(`${inv.id}: ${(e as Error).message}`);
      }
    }
  }

  return NextResponse.json({ scanned: invoices.length, reminded, markedOverdue, errors });
}
