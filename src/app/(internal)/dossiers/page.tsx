import Link from "next/link";
import { Folder, Plus, AlertTriangle, FilterX } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { canCreateDossier } from "@/lib/roles";
import { requiredDocuments } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";
import { DossiersFilterBar } from "./filter-bar";
import { KeyDates } from "@/components/dossier/key-dates";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; client?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;

  const q = params.q?.trim();
  const statusFilter = params.status as DossierStatus | undefined;

  const dossiers = await prisma.dossier.findMany({
    where: {
      ...(q && {
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { reference: { contains: q, mode: "insensitive" } },
          { client: { name: { contains: q, mode: "insensitive" } } },
          { dums: { some: { number: { contains: q, mode: "insensitive" } } } },
        ],
      }),
      ...(statusFilter && { status: statusFilter }),
      ...(params.client && { clientId: params.client }),
    },
    include: {
      client: true,
      dums: true,
      createdBy: { select: { role: true } },
      documents: {
        select: { category: true, uploadedBy: { select: { role: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  // Calcul des documents manquants par dossier + docs reçus du client
  const enriched = dossiers
    .map((d) => {
      const required = requiredDocuments(d.paymentMode);
      const present = new Set(d.documents.map((doc) => doc.category));
      const missing = required.filter((c) => !present.has(c));
      const fromClientCount = d.documents.filter(
        (doc) => doc.uploadedBy?.role === "CLIENT",
      ).length;
      const isNewFromClient =
        d.createdBy?.role === "CLIENT" && d.status === "OUVERTURE";
      return {
        ...d,
        missingCount: missing.length,
        docCount: d.documents.length,
        fromClientCount,
        isNewFromClient,
      };
    })
    // tri secondaire : regrouper les dossiers du même client, puis par date de maj
    .sort((a, b) => {
      const cmp = a.client.name.localeCompare(b.client.name, "fr", {
        sensitivity: "base",
      });
      if (cmp !== 0) return cmp;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const hasFilter = !!q || !!params.status;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Dossiers"
        subtitle={
          <>
            {enriched.length} dossier{enriched.length > 1 ? "s" : ""}
            {q && (
              <>
                {" "}· recherche <span className="text-[var(--color-fg)]">« {q} »</span>
              </>
            )}
          </>
        }
        actions={
          canCreateDossier(session.user.role) && (
            <Link href="/dossiers/nouveau">
              <Button>
                <Plus /> Nouveau dossier
              </Button>
            </Link>
          )
        }
      />

      <Card>
        <DossiersFilterBar initialQ={q} initialStatus={params.status} />

        {enriched.length === 0 ? (
          hasFilter ? (
            <EmptyState
              icon={FilterX}
              title="Aucun résultat"
              hint="Aucun dossier ne correspond à vos filtres. Essayez d'élargir la recherche."
              cta={
                <Link href="/dossiers">
                  <Button variant="outline" size="sm">
                    Réinitialiser les filtres
                  </Button>
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Folder}
              title="Aucun dossier"
              hint="Créez votre premier dossier pour commencer le suivi en douane."
              cta={
                canCreateDossier(session.user.role) && (
                  <Link href="/dossiers/nouveau">
                    <Button size="sm">
                      <Plus /> Nouveau dossier
                    </Button>
                  </Link>
                )
              }
            />
          )
        ) : (
          <>
            {/* Mobile: liste en cartes empilées, statut + référence mis en avant */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {enriched.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="row-link block px-4 py-3 hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)] transition-colors"
                >
                  {/* ligne 1 : statut large + numéro */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={d.status} />
                      {d.isNewFromClient && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-danger)] text-white" title="Nouveau dossier créé par le client">
                          NOUVEAU CLIENT
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
                    <span className="font-mono font-semibold text-[14px] text-[var(--color-fg)]">
                      {d.number}
                    </span>
                  </div>
                  {/* ligne 2 : référence (mise en avant) + client */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[13px] text-[var(--color-fg-2)] truncate">
                      {d.reference ?? <span className="text-[var(--color-fg-mute)] italic">sans réf.</span>}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {d.fromClientCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-[var(--color-danger)] text-white">
                          ● {d.fromClientCount} doc client
                        </span>
                      )}
                      {d.missingCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                          <AlertTriangle className="size-2.5" strokeWidth={2.25} />
                          {d.missingCount} doc{d.missingCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] truncate mt-0.5">
                    {d.client.name}
                    {d.dums.length > 0 && (
                      <span className="font-mono ml-1.5">
                        · DUM {d.dums.map((dum) => dum.number).join(", ")}
                      </span>
                    )}
                  </div>
                  {/* ligne 3 : infos secondaires en petit gris */}
                  <div className="flex items-center justify-between mt-1.5 text-[10.5px] text-[var(--color-fg-3)] tnum">
                    <span>
                      {formatCurrency(
                        d.goodsValue ? Number(d.goodsValue) : null,
                        d.goodsCurrency ?? "EUR",
                      )}
                      {d.goodsWeight && ` · ${formatNumber(Number(d.goodsWeight))} kg`}
                      {d.docCount > 0 && ` · ${d.docCount} doc${d.docCount > 1 ? "s" : ""}`}
                    </span>
                    <span>{formatDate(d.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: tableau ré-ordonné : statut, dossier, référence en tête */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[11.5px] font-medium text-[var(--color-fg-3)]">
                    <th className="text-left px-5 py-2.5 w-[180px]">Statut</th>
                    <th className="text-left px-5 py-2.5">Dossier</th>
                    <th className="text-left px-5 py-2.5">Référence</th>
                    <th className="text-left px-5 py-2.5">Client</th>
                    <th className="text-left px-5 py-2.5">DUM(s)</th>
                    <th className="text-center px-3 py-2.5">Docs</th>
                    <th className="text-left px-3 py-2.5">Visite / Livraison</th>
                    <th className="text-right px-5 py-2.5 font-normal text-[var(--color-fg-3)]">Valeur</th>
                    <th className="text-right px-5 py-2.5 font-normal text-[var(--color-fg-3)]">Poids</th>
                    <th className="text-right px-5 py-2.5">Maj</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={d.status} size="sm" />
                          {d.isNewFromClient && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-danger)] text-white" title="Nouveau dossier créé par le client">
                              NOUVEAU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/dossiers/${d.id}`}
                          className="font-mono font-semibold text-[13.5px] text-[var(--color-fg)] hover:text-[var(--color-accent)]"
                        >
                          {d.number}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[13px] text-[var(--color-fg-2)]">
                        {d.reference ?? <span className="text-[var(--color-fg-mute)] italic">—</span>}
                      </td>
                      <td className="px-5 py-2.5 truncate max-w-[200px] text-[12.5px] text-[var(--color-fg-3)]">
                        {d.client.name}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[11.5px] text-[var(--color-fg-3)]">
                        {d.dums.length === 0 ? "—" : d.dums.map((dum) => dum.number).join(", ")}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                          {d.fromClientCount > 0 && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-[var(--color-danger)] text-white"
                              title={`${d.fromClientCount} document(s) reçu(s) du client`}
                            >
                              ● {d.fromClientCount}
                            </span>
                          )}
                          {d.missingCount > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                              title={`${d.missingCount} document(s) manquant(s)`}
                            >
                              <AlertTriangle className="size-2.5" strokeWidth={2.25} />
                              {d.missingCount}
                            </span>
                          ) : d.fromClientCount === 0 ? (
                            <span className="text-[11px] text-[var(--color-fg-3)] tnum">
                              {d.docCount}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {d.visitDate || d.visitEffectiveDate || d.conformityVisitDate || d.conformityVisitEffectiveDate || d.deliveredAt ? (
                          <KeyDates
                            visitDate={d.visitDate}
                            visitEffectiveDate={d.visitEffectiveDate}
                            conformityVisitDate={d.conformityVisitDate}
                            conformityVisitEffectiveDate={d.conformityVisitEffectiveDate}
                            deliveredAt={d.deliveredAt}
                          />
                        ) : (
                          <span className="text-[11px] text-[var(--color-fg-mute)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[11.5px] text-[var(--color-fg-3)]">
                        {formatCurrency(
                          d.goodsValue ? Number(d.goodsValue) : null,
                          d.goodsCurrency ?? "EUR",
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[11.5px] text-[var(--color-fg-3)]">
                        {d.goodsWeight ? `${formatNumber(Number(d.goodsWeight))} kg` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-[var(--color-fg-3)] whitespace-nowrap">
                        {formatDate(d.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
