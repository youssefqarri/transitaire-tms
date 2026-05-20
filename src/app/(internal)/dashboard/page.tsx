import Link from "next/link";
import {
  Folder,
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { STATUS_LABELS, requiredDocuments } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";
import { KeyDates } from "@/components/dossier/key-dates";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

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
    activeDossiers,
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
      include: {
        client: true,
        dums: true,
        documents: { select: { category: true } },
      },
    }),
    prisma.dossier.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { notIn: ["CLOTURE", "ANNULE"] } },
    }),
    // Vue groupée par client : tous les dossiers actifs (tri côté JS)
    prisma.dossier.findMany({
      where: { status: { notIn: ["CLOTURE", "ANNULE"] } },
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        dums: true,
        documents: { select: { category: true } },
      },
    }),
  ]);

  const totalActive = statusGroups.reduce((s, g) => s + g._count._all, 0);

  // Calcule le nombre de docs manquants pour un dossier donné
  function countMissing(d: {
    paymentMode: "WITH_PAYMENT" | "WITHOUT_PAYMENT";
    documents: { category: string }[];
  }): number {
    const required = requiredDocuments(d.paymentMode);
    const present = new Set(d.documents.map((doc) => doc.category));
    return required.filter((c) => !present.has(c)).length;
  }

  // Grouper par client
  const byClient = new Map<
    string,
    {
      clientName: string;
      clientId: string;
      dossiers: typeof activeDossiers;
      totalValue: number;
    }
  >();
  for (const d of activeDossiers) {
    if (!byClient.has(d.clientId)) {
      byClient.set(d.clientId, {
        clientName: d.client.name,
        clientId: d.clientId,
        dossiers: [],
        totalValue: 0,
      });
    }
    const g = byClient.get(d.clientId)!;
    g.dossiers.push(d);
    if (d.goodsValue) g.totalValue += Number(d.goodsValue);
  }
  const groupedClients = [...byClient.values()].sort(
    (a, b) => b.dossiers.length - a.dossiers.length,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle={`Bonjour ${session.user.name.split(" ")[0]}, voici l'état actuel des dossiers.`}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dossiers ouverts"
          value={openDossiers}
          hint={`${totalDossiers} au total`}
          icon={Folder}
          href="/dossiers"
        />
        <StatCard
          label="À traiter"
          value={blockedDossiers}
          hint="documents · valeur · MCI"
          icon={AlertCircle}
          tone={blockedDossiers > 0 ? "warn" : "default"}
          href="/dossiers?status=BUREAU_VALEUR"
        />
        <StatCard
          label="Clôturés ce mois"
          value={closedThisMonth}
          hint="depuis le 1er"
          icon={CheckCircle2}
          tone={closedThisMonth > 0 ? "success" : "default"}
        />
        <StatCard
          label="Emails non lus"
          value={unreadEmails}
          icon={Mail}
          href="/emails"
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
              <EmptyState icon={Folder} title="Aucun dossier pour l'instant" />
            )}
            {recentDossiers.map((d) => (
              <Link
                key={d.id}
                href={`/dossiers/${d.id}`}
                className="row-link flex sm:grid sm:grid-cols-[minmax(0,1fr)_120px_130px_120px] items-center gap-3 sm:gap-4 px-5 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                {/* Col 1 : N° dossier + référence + client + docs manquants */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12.5px] text-[var(--color-fg)] font-medium">
                      {d.number}
                    </span>
                    {d.reference && (
                      <span className="text-[11.5px] text-[var(--color-fg-3)]">
                        · {d.reference}
                      </span>
                    )}
                  </div>
                  <div className="text-[12.5px] text-[var(--color-fg-3)] truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="truncate">{d.client.name}</span>
                    {d.dums.length > 0 && (
                      <span className="font-mono">
                        · DUM {d.dums.map((dum) => dum.number).join(", ")}
                      </span>
                    )}
                    {countMissing(d) > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                        <AlertTriangle className="size-2.5" strokeWidth={2.25} />
                        {countMissing(d)} doc{countMissing(d) > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                {/* Col 2 : Valeur + maj */}
                <div className="text-right hidden sm:block">
                  <div className="font-mono text-[12.5px] text-[var(--color-fg)] tnum">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </div>
                  <div className="text-[10.5px] text-[var(--color-fg-3)] mt-0.5">
                    {formatDate(d.updatedAt)}
                  </div>
                </div>
                {/* Col 3 : Dates visite douane / MCI / livraison */}
                <div className="hidden sm:block">
                  {d.visitDate || d.visitEffectiveDate || d.conformityVisitDate || d.conformityVisitEffectiveDate || d.deliveredAt ? (
                    <KeyDates
                      visitDate={d.visitDate}
                      visitEffectiveDate={d.visitEffectiveDate}
                      conformityVisitDate={d.conformityVisitDate}
                      conformityVisitEffectiveDate={d.conformityVisitEffectiveDate}
                      deliveredAt={d.deliveredAt}
                    />
                  ) : (
                    <span className="text-[10.5px] text-[var(--color-fg-mute)]">—</span>
                  )}
                </div>
                {/* Col 4 : Statut */}
                <div className="flex justify-end shrink-0">
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
                      <span className="text-[var(--color-fg-3)] tnum">{g._count._all}</span>
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

      {/* Dossiers actifs par client (déplié si peu de clients) */}
      <Card>
        <CardHeader>
          <CardTitle>Dossiers actifs par client</CardTitle>
          <span className="text-[11.5px] text-[var(--color-fg-3)] tnum">
            {groupedClients.length} client{groupedClients.length > 1 ? "s" : ""} ·{" "}
            {totalActive} dossier{totalActive > 1 ? "s" : ""}
          </span>
        </CardHeader>
        {groupedClients.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucun dossier actif.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {groupedClients.map((g) => (
              <details key={g.clientId} className="group" open={groupedClients.length <= 3}>
                <summary className="cursor-pointer list-none px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors">
                  <ChevronRight
                    className="size-4 text-[var(--color-fg-mute)] shrink-0 transition-transform group-open:rotate-90"
                    strokeWidth={2}
                  />
                  <span className="text-[13.5px] font-medium text-[var(--color-fg)] truncate flex-1">
                    {g.clientName}
                  </span>
                  <span className="text-[11.5px] text-[var(--color-fg-3)] shrink-0">
                    {g.dossiers.length} dossier{g.dossiers.length > 1 ? "s" : ""}
                  </span>
                  {g.totalValue > 0 && (
                    <span className="hidden sm:inline font-mono text-[12px] tnum text-[var(--color-fg-3)] shrink-0 w-[110px] text-right">
                      {formatCurrency(g.totalValue, "EUR")}
                    </span>
                  )}
                </summary>
                <div className="bg-[var(--color-surface-2)]/40 divide-y divide-[var(--color-border)]">
                  <Link
                    href={`/clients/${g.clientId}`}
                    className="flex items-center justify-end gap-1 pl-12 pr-5 py-2 text-[11.5px] text-[var(--color-accent)] hover:underline border-b border-[var(--color-border)]"
                  >
                    Voir la fiche client →
                  </Link>
                  {g.dossiers.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dossiers/${d.id}`}
                      className="flex items-center gap-3 pl-12 pr-5 py-2 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[12.5px] text-[var(--color-fg)] font-medium">
                            {d.number}
                          </span>
                          {d.reference && (
                            <span className="text-[11.5px] text-[var(--color-fg-3)]">
                              · {d.reference}
                            </span>
                          )}
                          {d.dums.length > 0 && (
                            <span className="font-mono text-[11px] text-[var(--color-fg-3)]">
                              DUM {d.dums.map((dum) => dum.number).join(", ")}
                            </span>
                          )}
                          {countMissing(d) > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                              <AlertTriangle className="size-2.5" strokeWidth={2.25} />
                              {countMissing(d)} doc{countMissing(d) > 1 ? "s" : ""}
                            </span>
                          )}
                          <KeyDates
                            visitDate={d.visitDate}
                            visitEffectiveDate={d.visitEffectiveDate}
                            conformityVisitDate={d.conformityVisitDate}
                            conformityVisitEffectiveDate={d.conformityVisitEffectiveDate}
                            deliveredAt={d.deliveredAt}
                            layout="row"
                          />
                        </div>
                      </div>
                      <div className="hidden sm:block font-mono text-[12px] tnum text-[var(--color-fg-3)] shrink-0">
                        {formatCurrency(
                          d.goodsValue ? Number(d.goodsValue) : null,
                          d.goodsCurrency ?? "EUR",
                        )}
                      </div>
                      <StatusBadge status={d.status} size="sm" />
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
