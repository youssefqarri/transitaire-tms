import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanForm } from "./plan-form";

export const dynamic = "force-dynamic";

const PERIOD: Record<string, string> = { MONTHLY: "Mensuel", YEARLY: "Annuel" };

export default async function PlansPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader title="Plans d'abonnement" subtitle="Offres proposées aux cabinets" />

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <PlanForm />
      </div>

      <Card>
        {plans.length === 0 ? (
          <EmptyState icon={CreditCard} title="Aucun plan" hint="Créez votre première offre ci-dessus." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)]">
                  <th className="px-5 py-2 text-left font-medium">Plan</th>
                  <th className="px-5 py-2 text-right font-medium">Prix</th>
                  <th className="px-5 py-2 text-left font-medium">Période</th>
                  <th className="px-5 py-2 text-right font-medium">Sièges</th>
                  <th className="px-5 py-2 text-right font-medium">Dossiers/mois</th>
                  <th className="px-5 py-2 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2.5 font-medium text-[var(--color-fg)]">{p.name}</td>
                    <td className="px-5 py-2.5 text-right tnum">
                      {Number(p.price).toLocaleString("fr-MA")} MAD
                    </td>
                    <td className="px-5 py-2.5">{PERIOD[p.period] ?? p.period}</td>
                    <td className="px-5 py-2.5 text-right tnum">{p.maxSeats ?? "∞"}</td>
                    <td className="px-5 py-2.5 text-right tnum">{p.maxDossiersPerMonth ?? "∞"}</td>
                    <td className="px-5 py-2.5">
                      {p.active ? (
                        <Badge tone="ok" dot>
                          Actif
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot>
                          Inactif
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
