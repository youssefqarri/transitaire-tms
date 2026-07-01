import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

// Tarifs de dépassement (add-ons métrés) — cf. grille tarifaire.
const DOSSIER_OVERAGE_MAD = 8; // par dossier au-delà du quota mensuel
const STORAGE_OVERAGE_MAD_PER_GB = 4; // par Go au-delà du quota

// Génération EN LOT des factures de dépassement du mois courant, pour tous les
// cabinets ayant un abonnement + plan. Même calcul que la route par-cabinet
// (POST /api/admin/orgs/[id]/overage-invoice) : (dossiers au-delà du quota × 8 MAD)
// + (Go au-delà × 4 MAD). Idempotent : on saute un cabinet si une facture existe déjà
// pour le mois courant (periodStart = début du mois). Encaissement hors-ligne (PENDING).
//
// Auth : admin plateforme connecté OU en-tête x-cron-secret === CRON_SECRET
// (le user planifie un curl mensuel).
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-cron-secret");
  const bySecret = !!secret && headerSecret === secret;

  let byAdmin = false;
  const session = await auth();
  if (session && isPlatformAdmin(session.user.email)) byAdmin = true;

  if (!bySecret && !byAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const subs = await prisma.subscription.findMany({
    where: { planId: { not: null } },
    include: { plan: true },
  });

  let created = 0;
  let totalMad = 0;
  const invoices: { orgId: string; amount: number }[] = [];

  for (const sub of subs) {
    if (!sub.plan) continue;

    // Idempotence : ne pas dupliquer une facture pour le mois courant.
    const existing = await prisma.subscriptionInvoice.findFirst({
      where: { orgId: sub.orgId, periodStart: monthStart },
      select: { id: true },
    });
    if (existing) continue;

    const [dossierCount, docAgg, mailAgg] = await Promise.all([
      prisma.dossier.count({ where: { orgId: sub.orgId, createdAt: { gte: monthStart } } }),
      prisma.document.aggregate({
        _sum: { fileSize: true },
        where: { deletedAt: null, dossier: { orgId: sub.orgId } },
      }),
      prisma.emailAttachment.aggregate({
        _sum: { size: true },
        where: { message: { account: { orgId: sub.orgId } } },
      }),
    ]);
    const storageGb = ((docAgg._sum.fileSize ?? 0) + (mailAgg._sum.size ?? 0)) / 1024 ** 3;

    const dossierOver =
      sub.plan.maxDossiersPerMonth != null
        ? Math.max(0, dossierCount - sub.plan.maxDossiersPerMonth)
        : 0;
    const storageOver =
      sub.plan.maxStorageGb != null ? Math.max(0, Math.ceil(storageGb - sub.plan.maxStorageGb)) : 0;
    const amount = dossierOver * DOSSIER_OVERAGE_MAD + storageOver * STORAGE_OVERAGE_MAD_PER_GB;

    if (amount <= 0) continue;

    const inv = await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: sub.id,
        orgId: sub.orgId,
        amount,
        periodStart: monthStart,
        periodEnd: now,
        dueAt: new Date(now.getTime() + 15 * 86400000),
        status: "PENDING",
      },
    });

    await audit({
      userId: session?.user.id,
      action: "CREATE_OVERAGE_INVOICE",
      entity: "SubscriptionInvoice",
      entityId: inv.id,
      metadata: { orgId: sub.orgId, amount, dossierOver, storageOver, batch: true },
      orgId: sub.orgId,
    });

    created += 1;
    totalMad += amount;
    invoices.push({ orgId: sub.orgId, amount });
  }

  return NextResponse.json({
    orgsTraites: subs.length,
    facturesCreees: created,
    totalMad,
    invoices,
  });
}
