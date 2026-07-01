import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, CreditCard, TrendingUp, FileText, Wallet, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrgRow } from "./org-row";
import { OrgSearch } from "./org-search";

export const dynamic = "force-dynamic";

const fmtMAD = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;

export default async function AdminOrgsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const query = ((await searchParams).q ?? "").trim();
  const orgWhere = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { slug: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [orgs, plansRaw, totalCabinets, activeCabinets, activeSubs, paymentsAgg, unpaidInvoices] =
    await Promise.all([
      prisma.organization.findMany({
        where: orgWhere,
        include: {
          _count: { select: { users: true, dossiers: true } },
          subscription: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.plan.findMany({
        where: { active: true },
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          priceYearly: true,
          maxSeats: true,
          maxDossiersPerMonth: true,
          maxStorageGb: true,
          includedAddons: true,
        },
      }),
      prisma.organization.count(),
      prisma.organization.count({ where: { active: true } }),
      prisma.subscription.findMany({
        where: { status: "ACTIVE", planId: { not: null } },
        select: { plan: { select: { price: true } } },
      }),
      prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
      prisma.subscriptionInvoice.findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        select: { amount: true, vatRate: true, paidAmount: true },
      }),
    ]);

  const plans = plansRaw.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    priceYearly: p.priceYearly != null ? Number(p.priceYearly) : null,
    maxSeats: p.maxSeats,
    maxDossiersPerMonth: p.maxDossiersPerMonth,
    maxStorageGb: p.maxStorageGb,
    includedAddons: p.includedAddons,
  }));

  // Indicateurs plateforme (sur l'ensemble des cabinets, indépendamment de la recherche).
  const mrr = activeSubs.reduce((s, x) => s + Number(x.plan?.price ?? 0), 0);
  const encaisse = Number(paymentsAgg._sum.amount ?? 0);
  const reste = unpaidInvoices.reduce((s, inv) => {
    const ttc = Number(inv.amount) * (1 + Number(inv.vatRate) / 100);
    return s + Math.max(0, ttc - Number(inv.paidAmount));
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cabinets"
        subtitle={`${totalCabinets} cabinet${totalCabinets > 1 ? "s" : ""} sur la plateforme`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/revenus">
              <Button variant="outline">
                <TrendingUp className="size-4" /> Revenus
              </Button>
            </Link>
            <Link href="/admin/plans">
              <Button variant="outline">
                <CreditCard className="size-4" /> Plans
              </Button>
            </Link>
            <Link href="/admin/facturation">
              <Button variant="outline">
                <FileText className="size-4" /> Facturation
              </Button>
            </Link>
            <Link href="/admin/nouveau">
              <Button>
                <Plus className="size-4" /> Nouveau cabinet
              </Button>
            </Link>
          </div>
        }
      />

      {/* Indicateurs plateforme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Building2}
          label="Cabinets"
          value={totalCabinets}
          hint={`${activeCabinets} actif${activeCabinets > 1 ? "s" : ""}`}
        />
        <StatCard icon={TrendingUp} label="MRR (récurrent / mois)" value={fmtMAD(mrr)} href="/admin/revenus" />
        <StatCard icon={Wallet} label="Encaissé (abonnements)" value={fmtMAD(encaisse)} tone="success" />
        <StatCard
          icon={Clock}
          label="Reste à encaisser"
          value={fmtMAD(reste)}
          tone={reste > 0 ? "warn" : "default"}
        />
      </div>

      <Card>
        <div className="px-5 py-3 border-b border-[var(--color-border)]">
          <OrgSearch initial={query} />
        </div>
        {orgs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={query ? "Aucun cabinet ne correspond" : "Aucun cabinet"}
            hint={query ? `Recherche : « ${query} »` : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)]">
                  <th className="px-5 py-2 text-left font-medium">Cabinet</th>
                  <th className="px-5 py-2 text-left font-medium">Slug</th>
                  <th className="px-5 py-2 text-right font-medium">Utilisateurs</th>
                  <th className="px-5 py-2 text-right font-medium">Dossiers</th>
                  <th className="px-5 py-2 text-left font-medium">Abonnement</th>
                  <th className="px-5 py-2 text-left font-medium">Échéance</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <OrgRow
                    key={o.id}
                    org={{
                      id: o.id,
                      name: o.name,
                      slug: o.slug,
                      active: o.active,
                      users: o._count.users,
                      dossiers: o._count.dossiers,
                      subscription: o.subscription
                        ? {
                            status: o.subscription.status,
                            planId: o.subscription.planId,
                            planName: o.subscription.plan?.name ?? null,
                            currentPeriodEnd: o.subscription.currentPeriodEnd
                              ? o.subscription.currentPeriodEnd.toISOString()
                              : null,
                            graceUntil: o.subscription.graceUntil
                              ? o.subscription.graceUntil.toISOString()
                              : null,
                            addons: o.subscription.addons,
                          }
                        : null,
                    }}
                    plans={plans}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
