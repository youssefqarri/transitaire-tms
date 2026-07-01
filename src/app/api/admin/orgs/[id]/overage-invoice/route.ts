import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

// Tarifs de dépassement (add-ons métrés) — cf. grille tarifaire.
const DOSSIER_OVERAGE_MAD = 8; // par dossier au-delà du quota mensuel
const STORAGE_OVERAGE_MAD_PER_GB = 4; // par Go au-delà du quota

// Génère une facture d'abonnement (SubscriptionInvoice) pour le dépassement du mois
// courant : (dossiers au-delà du quota × 8 MAD) + (Go au-delà × 4 MAD). Encaissement
// hors-ligne (statut PENDING).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sub = await prisma.subscription.findUnique({ where: { orgId }, include: { plan: true } });
  if (!sub) return NextResponse.json({ error: "Ce cabinet n'a pas d'abonnement." }, { status: 400 });
  if (!sub.plan) return NextResponse.json({ error: "Aucun plan associé au cabinet." }, { status: 400 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dossierCount, docAgg, mailAgg] = await Promise.all([
    prisma.dossier.count({ where: { orgId, createdAt: { gte: monthStart } } }),
    prisma.document.aggregate({ _sum: { fileSize: true }, where: { deletedAt: null, dossier: { orgId } } }),
    prisma.emailAttachment.aggregate({ _sum: { size: true }, where: { message: { account: { orgId } } } }),
  ]);
  const storageGb = ((docAgg._sum.fileSize ?? 0) + (mailAgg._sum.size ?? 0)) / 1024 ** 3;

  const dossierOver =
    sub.plan.maxDossiersPerMonth != null ? Math.max(0, dossierCount - sub.plan.maxDossiersPerMonth) : 0;
  const storageOver =
    sub.plan.maxStorageGb != null ? Math.max(0, Math.ceil(storageGb - sub.plan.maxStorageGb)) : 0;
  const amount = dossierOver * DOSSIER_OVERAGE_MAD + storageOver * STORAGE_OVERAGE_MAD_PER_GB;

  if (amount <= 0)
    return NextResponse.json({ error: "Aucun dépassement à facturer ce mois-ci." }, { status: 400 });

  const inv = await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: sub.id,
      orgId,
      amount,
      periodStart: monthStart,
      periodEnd: now,
      dueAt: new Date(now.getTime() + 15 * 86400000),
      status: "PENDING",
    },
  });

  await audit({
    userId: session.user.id,
    action: "CREATE_OVERAGE_INVOICE",
    entity: "SubscriptionInvoice",
    entityId: inv.id,
    metadata: { orgId, amount, dossierOver, storageOver },
    orgId,
  });
  return NextResponse.json({ id: inv.id, amount, dossierOver, storageOver });
}
