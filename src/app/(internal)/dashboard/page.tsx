import {
  Folder,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
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
    totalDUMs,
    recentDossiers,
    statusGroups,
  ] = await Promise.all([
    prisma.dossier.count(),
    prisma.dossier.count({
      where: { status: { notIn: ["CLOTURE", "ANNULE"] } },
    }),
    prisma.dossier.count({
      where: {
        status: { in: ["DOCUMENTS_MANQUANTS", "DEMANDE_DOCUMENTS", "BUREAU_VALEUR"] },
      },
    }),
    prisma.dossier.count({
      where: {
        status: "CLOTURE",
        closedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.emailMessage.count({ where: { isRead: false } }),
    prisma.dUM.count(),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour, {session.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Voici l'état actuel des dossiers de transit.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dossiers ouverts"
          value={openDossiers}
          hint={`${totalDossiers} au total`}
          icon={Folder}
          tone="primary"
        />
        <StatCard
          label="À traiter"
          value={blockedDossiers}
          hint="documents manquants / valeur"
          icon={AlertCircle}
          tone="warn"
        />
        <StatCard
          label="Clôturés ce mois"
          value={closedThisMonth}
          icon={CheckCircle2}
          tone="ok"
        />
        <StatCard
          label="Emails non lus"
          value={unreadEmails}
          hint={`${totalDUMs} DUMs enregistrées`}
          icon={Mail}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <div className="font-semibold">Dossiers récents</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">
                8 derniers mouvements
              </div>
            </div>
            <Link
              href="/dossiers"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentDossiers.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
                Aucun dossier pour l'instant.
              </div>
            )}
            {recentDossiers.map((d) => (
              <Link
                key={d.id}
                href={`/dossiers/${d.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-muted)] transition-colors"
              >
                <div className="size-10 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0">
                  <Folder className="size-4 text-[var(--color-muted-foreground)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.number}</span>
                    {d.reference && (
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        · {d.reference}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
                    {d.client.name}
                    {d.dums.length > 0 && (
                      <span> · DUM {d.dums.map((dum) => dum.number).join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block text-right text-xs text-[var(--color-muted-foreground)]">
                  {formatCurrency(
                    d.goodsValue ? Number(d.goodsValue) : null,
                    d.goodsCurrency ?? "EUR",
                  )}
                  <div className="mt-0.5">{formatDate(d.updatedAt)}</div>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b border-[var(--color-border)]">
            <div className="font-semibold">Statuts en cours</div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              Répartition des dossiers actifs
            </div>
          </div>
          <div className="p-5 space-y-3">
            {statusGroups.length === 0 && (
              <div className="text-sm text-[var(--color-muted-foreground)]">
                Aucun dossier actif.
              </div>
            )}
            {statusGroups
              .sort((a, b) => b._count._all - a._count._all)
              .map((g) => {
                const total = statusGroups.reduce((s, x) => s + x._count._all, 0);
                const pct = total ? (g._count._all / total) * 100 : 0;
                return (
                  <div key={g.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate">
                        {STATUS_LABELS[g.status as DossierStatus]}
                      </span>
                      <span className="font-medium tabular-nums">
                        {g._count._all}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[oklch(60%_0.18_280)] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="font-semibold flex items-center gap-2">
            <FileText className="size-4" /> Raccourcis
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          {[
            { href: "/dossiers/nouveau", label: "Nouveau dossier", icon: Folder },
            { href: "/dums", label: "DUMs", icon: FileText },
            { href: "/emails", label: "Inbox", icon: Mail },
            { href: "/notifications", label: "Notifications", icon: Clock },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-muted)] hover:border-[var(--color-primary)]/30 transition-all group"
            >
              <Icon className="size-5 text-[var(--color-primary)] mb-3" />
              <div className="text-sm font-medium">{label}</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
