import Link from "next/link";
import { Folder, AlertCircle, CheckCircle2, Mail, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [
    totalDossiers,
    openDossiers,
    blockedDossiers,
    closedThisMonth,
    unreadEmails,
    recentDossiers,
    statusGroups,
  ] = await Promise.all([
    prisma.dossier.count(),
    prisma.dossier.count({ where: { status: { notIn: ["CLOTURE", "ANNULE"] } } }),
    prisma.dossier.count({
      where: { status: { in: ["DOCUMENTS_MANQUANTS", "DEMANDE_DOCUMENTS", "BUREAU_VALEUR"] } },
    }),
    prisma.dossier.count({
      where: {
        status: "CLOTURE",
        closedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.emailMessage.count({ where: { isRead: false } }),
    prisma.dossier.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: { client: true, dums: true },
    }),
    prisma.dossier.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { notIn: ["CLOTURE", "ANNULE"] } },
    }),
  ]);

  const totalActive = statusGroups.reduce((s, g) => s + g._count._all, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
          Bonjour {session.user.name.split(" ")[0]}, voici l'état actuel des dossiers.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dossiers ouverts"
          value={openDossiers}
          hint={`${totalDossiers} au total`}
          icon={Folder}
        />
        <StatCard
          label="À traiter"
          value={blockedDossiers}
          hint="documents · valeur · MCI"
          icon={AlertCircle}
        />
        <StatCard
          label="Clôturés ce mois"
          value={closedThisMonth}
          hint="depuis le 1er"
          icon={CheckCircle2}
        />
        <StatCard
          label="Emails non lus"
          value={unreadEmails}
          icon={Mail}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Mouvements récents */}
        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
            <Link
              href="/dossiers"
              className="text-[12px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)] inline-flex items-center gap-1"
            >
              Tout voir <ArrowUpRight className="size-3" strokeWidth={2} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-[var(--color-border)]">
            {recentDossiers.length === 0 && (
              <div className="py-10 text-center text-[13px] text-[var(--color-fg-3)]">
                Aucun dossier pour l'instant.
              </div>
            )}
            {recentDossiers.map((d) => (
              <Link
                key={d.id}
                href={`/dossiers/${d.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12.5px] text-[var(--color-fg)] font-medium">
                      {d.number}
                    </span>
                    {d.reference && (
                      <span className="text-[11.5px] text-[var(--color-fg-mute)]">
                        · {d.reference}
                      </span>
                    )}
                  </div>
                  <div className="text-[12.5px] text-[var(--color-fg-3)] truncate mt-0.5">
                    {d.client.name}
                    {d.dums.length > 0 && (
                      <span className="font-mono ml-1.5">
                        · DUM {d.dums.map((dum) => dum.number).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block text-right shrink-0 w-[120px]">
                  <div className="font-mono text-[12.5px] text-[var(--color-fg)] tnum">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </div>
                  <div className="text-[10.5px] text-[var(--color-fg-mute)] mt-0.5">
                    {formatDate(d.updatedAt)}
                  </div>
                </div>
                <div className="shrink-0 w-[160px] flex justify-start">
                  <StatusBadge status={d.status} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
            <span className="text-[11.5px] text-[var(--color-fg-3)] tnum">{totalActive} actifs</span>
          </CardHeader>
          <div className="px-5 py-3 space-y-3">
            {statusGroups.length === 0 && (
              <div className="py-6 text-center text-[13px] text-[var(--color-fg-3)]">
                Aucun dossier actif.
              </div>
            )}
            {statusGroups
              .sort((a, b) => b._count._all - a._count._all)
              .map((g) => {
                const pct = totalActive ? (g._count._all / totalActive) * 100 : 0;
                return (
                  <div key={g.status}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                      <span className="text-[var(--color-fg-2)] truncate pr-2">
                        {STATUS_LABELS[g.status as DossierStatus]}
                      </span>
                      <span className="text-[var(--color-fg-3)] tnum">
                        {g._count._all}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-fg)] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
}
