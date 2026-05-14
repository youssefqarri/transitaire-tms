import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
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
    prisma.dossier.count({ where: { status: { notIn: ["CLOTURE", "ANNULE"] } } }),
    prisma.dossier.count({
      where: {
        status: { in: ["DOCUMENTS_MANQUANTS", "DEMANDE_DOCUMENTS", "BUREAU_VALEUR"] },
      },
    }),
    prisma.dossier.count({
      where: {
        status: "CLOTURE",
        closedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.emailMessage.count({ where: { isRead: false } }),
    prisma.dUM.count(),
    prisma.dossier.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { client: true, dums: true },
    }),
    prisma.dossier.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { notIn: ["CLOTURE", "ANNULE"] } },
    }),
  ]);

  const todayFr = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const totalActive = statusGroups.reduce((s, g) => s + g._count._all, 0);

  return (
    <div className="space-y-12 animate-fade-up max-w-[1280px]">
      {/* En-tête éditorial */}
      <header>
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <span className="label-eyebrow text-[var(--color-ink)]">
            — Édition du jour · {todayFr}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)] tabular">
            N° {String(totalDossiers).padStart(4, "0")}
          </span>
        </div>
        <h1
          className="font-display text-[64px] leading-[0.95] tracking-[-0.028em] max-w-3xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
        >
          Bonjour {session.user.name.split(" ")[0]}
          <span className="text-[var(--color-stamp)]">,</span>{" "}
          <em
            style={{
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 144, "SOFT" 90, "wght" 350',
            }}
          >
            voici l'état du registre
          </em>
          .
        </h1>
        <div className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          {totalActive} dossier{totalActive > 1 ? "s" : ""} en cours · {totalDUMs} DUM
          {totalDUMs > 1 ? "s" : ""} enregistrée{totalDUMs > 1 ? "s" : ""} ·{" "}
          {closedThisMonth} clôture{closedThisMonth > 1 ? "s" : ""} ce mois.
        </div>
      </header>

      {/* ── Indicateurs ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-[var(--color-rule-strong)]">
          <StatCard index="01" label="Dossiers ouverts" value={openDossiers} hint={`${totalDossiers} au registre`} className="border-r-0 lg:border-r border-t-0 border-b-0" />
          <StatCard index="02" label="À traiter" value={blockedDossiers} tone="stamp" hint="documents · valeur · MCI" className="border-r-0 lg:border-r border-t-0 border-b-0" />
          <StatCard index="03" label="Clôturés ce mois" value={closedThisMonth} tone="leaf" hint="depuis le 1er" className="border-r-0 lg:border-r border-t-0 border-b-0" />
          <StatCard index="04" label="Correspondance" value={unreadEmails} tone="archive" hint="non lue" className="border-t-0 border-b-0" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
        {/* ── Mouvements récents ── */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2
              className="font-display text-[28px] tracking-[-0.018em]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
            >
              Mouvements récents
            </h2>
            <Link
              href="/dossiers"
              className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] inline-flex items-center gap-1"
            >
              Tout consulter <ArrowUpRight className="size-3" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="border-t border-b border-[var(--color-rule-strong)]">
            {recentDossiers.length === 0 && (
              <div className="py-16 text-center text-[14px] text-[var(--color-ink-mute)] font-display italic">
                Aucun mouvement à ce jour.
              </div>
            )}
            {recentDossiers.map((d, idx) => (
              <Link
                key={d.id}
                href={`/dossiers/${d.id}`}
                className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-5 py-3.5 px-1 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-paper-strong)] transition-colors"
              >
                <span className="font-mono text-[10px] text-[var(--color-ink-mute)] tabular w-6">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-[13px] tabular text-[var(--color-ink)] group-hover:underline underline-offset-3 decoration-[var(--color-rule-strong)]">
                      {d.number}
                    </span>
                    {d.reference && (
                      <span className="font-mono text-[11px] text-[var(--color-ink-mute)]">
                        · {d.reference}
                      </span>
                    )}
                  </div>
                  <div className="text-[14px] text-[var(--color-ink-soft)] truncate">
                    <span className="font-display italic mr-1">{d.client.name}</span>
                    {d.dums.length > 0 && (
                      <span className="font-mono text-[11px] text-[var(--color-ink-mute)]">
                        — DUM {d.dums.map((dum) => dum.number).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="font-mono text-[12px] tabular text-[var(--color-ink)]">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] tabular">
                    {formatDate(d.updatedAt)}
                  </div>
                </div>
                <StatusBadge status={d.status} size="sm" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Répartition / colonne droite ── */}
        <aside>
          <h2
            className="font-display text-[28px] tracking-[-0.018em] mb-4"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
          >
            Répartition
          </h2>
          <div className="border-t border-[var(--color-rule-strong)]">
            {statusGroups.length === 0 && (
              <div className="py-12 text-[14px] text-[var(--color-ink-mute)] font-display italic">
                Aucun dossier actif.
              </div>
            )}
            {statusGroups
              .sort((a, b) => b._count._all - a._count._all)
              .map((g, i) => {
                const pct = totalActive ? (g._count._all / totalActive) * 100 : 0;
                return (
                  <div
                    key={g.status}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 border-b border-[var(--color-rule)] last:border-b-0"
                  >
                    <span className="font-mono text-[10px] text-[var(--color-ink-mute)] tabular w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="text-[13px] text-[var(--color-ink)]">
                        {STATUS_LABELS[g.status as DossierStatus]}
                      </div>
                      <div className="mt-1.5 h-[2px] bg-[var(--color-rule)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-ink)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-[14px] tabular text-[var(--color-ink)] tnum">
                      {String(g._count._all).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* citation éditoriale */}
          <blockquote className="mt-10 pl-5 border-l-2 border-[var(--color-stamp)]">
            <p
              className="font-display italic text-[18px] leading-snug text-[var(--color-ink-soft)]"
              style={{ fontVariationSettings: '"opsz" 32, "SOFT" 100, "wght" 380' }}
            >
              « La douane n'est pas qu'un guichet — c'est un récit qui demande à être tenu, page après page. »
            </p>
            <footer className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
              — Manuel du transitaire
            </footer>
          </blockquote>
        </aside>
      </div>
    </div>
  );
}
