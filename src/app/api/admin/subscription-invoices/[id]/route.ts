import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

// Marque une facture d'abonnement comme payée (encaissement hors-ligne).
// Réservé aux admins plateforme.
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const inv = await prisma.subscriptionInvoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  const updated = await prisma.subscriptionInvoice.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });

  await audit({
    userId: session.user.id,
    action: "MARK_SUBSCRIPTION_INVOICE_PAID",
    entity: "SubscriptionInvoice",
    entityId: id,
    metadata: { orgId: inv.orgId, amount: Number(inv.amount) },
    orgId: inv.orgId,
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
