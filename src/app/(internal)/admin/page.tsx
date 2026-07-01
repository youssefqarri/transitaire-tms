import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, CreditCard, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { OrgRow } from "./org-row";

export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const [orgs, plansRaw] = await Promise.all([
    prisma.organization.findMany({
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
  ]);
  // Decimal → number (sérialisable vers le composant client SubscriptionManager).
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cabinets"
        subtitle={`${orgs.length} organisation${orgs.length > 1 ? "s" : ""} sur la plateforme`}
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
            <Link href="/admin/nouveau">
              <Button>
                <Plus className="size-4" /> Nouveau cabinet
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        {orgs.length === 0 ? (
          <EmptyState icon={Building2} title="Aucun cabinet" />
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
