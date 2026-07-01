import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";
import { recomputeInvoicePaid } from "@/lib/subscription-billing";

const schema = z.object({
  amount: z.number().positive().optional(),
  method: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  date: z.string().optional(),
  note: z.string().max(500).nullable().optional(),
});

async function guard(pid: string) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) return { error: "Forbidden" as const, status: 403 };
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: pid },
    include: { invoice: { select: { orgId: true } } },
  });
  if (!payment) return { error: "Introuvable" as const, status: 404 };
  return { session, payment };
}

// Édite un encaissement.
export async function PATCH(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const g = await guard(pid);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const d = parsed.data;

  await prisma.subscriptionPayment.update({
    where: { id: pid },
    data: {
      ...(d.amount !== undefined ? { amount: d.amount } : {}),
      ...(d.method !== undefined ? { method: d.method || null } : {}),
      ...(d.reference !== undefined ? { reference: d.reference || null } : {}),
      ...(d.date !== undefined ? { paidAt: new Date(d.date) } : {}),
      ...(d.note !== undefined ? { note: d.note || null } : {}),
    },
  });
  await recomputeInvoicePaid(g.payment.invoiceId);

  await audit({
    userId: g.session.user.id,
    action: "UPDATE_SUBSCRIPTION_PAYMENT",
    entity: "SubscriptionPayment",
    entityId: pid,
    metadata: { orgId: g.payment.invoice.orgId, invoiceId: g.payment.invoiceId },
    orgId: g.payment.invoice.orgId,
  });
  return NextResponse.json({ ok: true });
}

// Suppression douce (soft delete) d'un encaissement.
export async function DELETE(_req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const g = await guard(pid);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  await prisma.subscriptionPayment.update({ where: { id: pid }, data: { deletedAt: new Date() } });
  await recomputeInvoicePaid(g.payment.invoiceId);

  await audit({
    userId: g.session.user.id,
    action: "DELETE_SUBSCRIPTION_PAYMENT",
    entity: "SubscriptionPayment",
    entityId: pid,
    metadata: { orgId: g.payment.invoice.orgId, invoiceId: g.payment.invoiceId },
    orgId: g.payment.invoice.orgId,
  });
  return NextResponse.json({ ok: true });
}
