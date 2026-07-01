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
import { ColumnHeader } from "@/components/ui/column-header";
import { OrgRow } from "./org-row";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const fmtMAD = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;

const SUB_OPTIONS = [
  { value: "NONE", label: "Sans abonnement" },
  { value: "TRIAL", label: "Essai" },
  { value: "ACTIVE", label: "Actif" },
  { value: "PAST_DUE", label: "Impayé" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "CANCELLED", label: "Résilié" },
];
const SUB_STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"] as const;

export default async function AdminOrgsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; slug?: string; sub?: string }>;
}) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const slugQuery = (params.slug ?? "").trim();
  const sub = params.sub ?? "";
  const hasFilter = !!query || !!slugQuery || !!sub;

  const and: Prisma.OrganizationWhereInput[] = [];
  if (query) and.push({ name: { contains: query, mode: "insensitive" } });
  if (slugQuery) and.push({ slug: { contains: slugQuery, mode: "insensitive" } });
  if (sub === "NONE") and.push({ subscription: { is: null } });
  else if ((SUB_STATUSES as readonly string[]).includes(sub))
    and.push({ subscription: { status: sub as (typeof SUB_STATUSES)[number] } });
  const orgWhere: Prisma.OrganizationWhereInput = and.length ? { AND: and } : {};

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
        {orgs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasFilter ? "Aucun cabinet ne correspond" : "Aucun cabinet"}
            hint={hasFilter ? "Aucun cabinet ne correspond à votre recherche." : undefined}
            cta={
              hasFilter ? (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Réinitialiser
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          // overflow-x-auto sur mobile (scroll horizontal), mais visible sur desktop
          // pour ne jamais rogner le menu déroulant des filtres d'en-tête (table courte).
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[12px]">
                  <ColumnHeader label="Cabinet" className="px-5" filter={{ type: "text", param: "q" }} />
                  <ColumnHeader label="Slug" className="px-5" filter={{ type: "text", param: "slug" }} />
                  <ColumnHeader label="Utilisateurs" align="right" className="px-5" />
                  <ColumnHeader label="Dossiers" align="right" className="px-5" />
                  <ColumnHeader
                    label="Abonnement"
                    className="px-5"
                    filter={{ type: "select", param: "sub", options: SUB_OPTIONS }}
                  />
                  <ColumnHeader label="Échéance" className="px-5" />
                  <ColumnHeader label="" className="px-5" />
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
