import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, CreditCard } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SubscriptionManager } from "./subscription-manager";

export const dynamic = "force-dynamic";

const SUB_TONE = {
  TRIAL: "info",
  ACTIVE: "ok",
  PAST_DUE: "warn",
  SUSPENDED: "danger",
  CANCELLED: "neutral",
} as const;
const SUB_LABEL = {
  TRIAL: "Essai",
  ACTIVE: "Actif",
  PAST_DUE: "Impayé",
  SUSPENDED: "Suspendu",
  CANCELLED: "Résilié",
} as const;

export default async function AdminOrgsPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const [orgs, plans] = await Promise.all([
    prisma.organization.findMany({
      include: {
        _count: { select: { users: true, dossiers: true } },
        subscription: { include: { plan: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cabinets"
        subtitle={`${orgs.length} organisation${orgs.length > 1 ? "s" : ""} sur la plateforme`}
        actions={
          <div className="flex items-center gap-2">
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
                {orgs.map((o) => {
                  const sub = o.subscription;
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="px-5 py-2.5 font-medium text-[var(--color-fg)]">
                        {o.name}
                        {!o.active && (
                          <span className="ml-2 text-[11px] text-[var(--color-danger)]">(accès coupé)</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[var(--color-fg-3)]">{o.slug}</td>
                      <td className="px-5 py-2.5 text-right tnum">{o._count.users}</td>
                      <td className="px-5 py-2.5 text-right tnum">{o._count.dossiers}</td>
                      <td className="px-5 py-2.5">
                        {sub ? (
                          <Badge tone={SUB_TONE[sub.status]} dot>
                            {SUB_LABEL[sub.status]}
                            {sub.plan ? ` · ${sub.plan.name}` : ""}
                          </Badge>
                        ) : (
                          <span className="text-[var(--color-fg-mute)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-3)] tnum">
                        {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <SubscriptionManager
                          orgId={o.id}
                          orgName={o.name}
                          plans={plans}
                          subscription={
                            sub
                              ? {
                                  status: sub.status,
                                  planId: sub.planId,
                                  currentPeriodEnd: sub.currentPeriodEnd
                                    ? sub.currentPeriodEnd.toISOString()
                                    : null,
                                }
                              : null
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
