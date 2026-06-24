import Link from "next/link";
import { Folder, Plus, AlertTriangle, FilterX } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { canCreateDossier } from "@/lib/roles";
import {
  requiredDocuments,
  DOCUMENT_CATEGORY_LABELS,
  STATUS_LABELS,
  ACTION_REQUIRED_STATUSES,
  ACTION_REQUIRED_KEY,
  ACTION_REQUIRED_LABEL,
} from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";
import { ColumnHeader } from "@/components/ui/column-header";
import { KeyDates } from "@/components/dossier/key-dates";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    number?: string;
    reference?: string;
    clientName?: string;
    dum?: string;
    client?: string;
    sort?: string;
    dir?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;

  // « A_TRAITER » est un bucket synthétique (plusieurs statuts), pas un vrai statut.
  const isActionBucket = params.status === ACTION_REQUIRED_KEY;
  const statusFilter = !isActionBucket
    ? (params.status as DossierStatus | undefined)
    : undefined;
  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });

  // Filtres par colonne (texte) + sens du tri.
  const fNumber = params.number?.trim();
  const fReference = params.reference?.trim();
  const fClient = params.clientName?.trim();
  const fDum = params.dum?.trim();
  const dir = params.dir === "asc" ? ("asc" as const) : ("desc" as const);

  // Le commis en douane ne voit jamais les dossiers clôturés / annulés.
  const hideClosed = session.user.role === "COMMIS_DOUANE";
  const statusWhere =
    isActionBucket
      ? { in: ACTION_REQUIRED_STATUSES }
      : statusFilter && hideClosed
        ? { equals: statusFilter, notIn: ["CLOTURE", "ANNULE"] as DossierStatus[] }
        : statusFilter
          ? statusFilter
          : hideClosed
            ? { notIn: ["CLOTURE", "ANNULE"] as DossierStatus[] }
            : undefined;

  const where = {
    deletedAt: null,
    ...(fNumber && { number: { contains: fNumber, mode: "insensitive" as const } }),
    ...(fReference && { reference: { contains: fReference, mode: "insensitive" as const } }),
    ...(fClient && { client: { name: { contains: fClient, mode: "insensitive" as const } } }),
    ...(fDum && { dums: { some: { number: { contains: fDum, mode: "insensitive" as const } } } }),
    ...(statusWhere && { status: statusWhere }),
    ...(params.client && { clientId: params.client }),
  };

  const [total, dossiers] = await Promise.all([
    prisma.dossier.count({ where }),
    prisma.dossier.findMany({
      where,
      include: {
        client: true,
        dums: true,
        createdBy: { select: { role: true } },
        documents: {
          where: { deletedAt: null },
          select: { category: true, uploadedBy: { select: { role: true } } },
        },
      },
      // Tri par colonne si demandé ; sinon ordre chronologique par défaut
      // (dossiers récents en tête, clôturés rejetés à la fin) — inchangé.
      orderBy:
        params.sort === "status"
          ? { status: dir }
          : params.sort === "number"
            ? { number: dir }
            : params.sort === "reference"
              ? { reference: { sort: dir, nulls: "last" } }
              : params.sort === "client"
                ? { client: { name: dir } }
                : params.sort === "docs"
                  ? { documents: { _count: dir } }
                  : params.sort === "visit"
                    ? { visitDate: { sort: dir, nulls: "last" } }
                    : params.sort === "value"
                      ? { goodsValue: { sort: dir, nulls: "last" } }
                      : params.sort === "weight"
                        ? { goodsWeight: { sort: dir, nulls: "last" } }
                        : params.sort === "updatedAt"
                          ? { updatedAt: dir }
                          : [
                              { closedAt: { sort: "desc" as const, nulls: "first" as const } },
                              { createdAt: "desc" as const },
                            ],
      skip,
      take: size,
    }),
  ]);

  // Calcul des documents manquants par dossier + docs reçus du client
  const enriched = dossiers
    .map((d) => {
      const required = requiredDocuments(d.paymentMode, d.transport);
      const present = new Set(d.documents.map((doc) => doc.category));
      const missing = required.filter((c) => !present.has(c));
      const clientDocs = d.documents.filter((doc) => doc.uploadedBy?.role === "CLIENT");
      const fromClientCount = clientDocs.length;
      const fromClientDocs = [
        ...new Set(clientDocs.map((doc) => DOCUMENT_CATEGORY_LABELS[doc.category])),
      ];
      const isNewFromClient =
        d.createdBy?.role === "CLIENT" && d.status === "OUVERTURE";
      return {
        ...d,
        missingCount: missing.length,
        missingDocs: missing.map((c) => DOCUMENT_CATEGORY_LABELS[c]),
        docCount: d.documents.length,
        fromClientCount,
        fromClientDocs,
        isNewFromClient,
      };
    });

  const hasFilter =
    !!fNumber || !!fReference || !!fClient || !!fDum || !!params.status;

  // Options de filtre pour la colonne « Statut » (bucket « À traiter » + tous les statuts).
  const statusOptions = [
    { value: ACTION_REQUIRED_KEY, label: ACTION_REQUIRED_LABEL },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Dossiers"
        subtitle={
          <>
            {total} dossier{total > 1 ? "s" : ""}
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
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-danger)] text-white" title="Nouveau dossier créé par le client">
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
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-info-soft)] text-[var(--color-info)] cursor-default"
                          title={`Reçus du client :\n• ${d.fromClientDocs.join("\n• ")}`}
                        >
                          ● {d.fromClientCount} doc client
                        </span>
                      )}
                      {d.missingCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)] cursor-default"
                          title={`Documents manquants :\n• ${d.missingDocs.join("\n• ")}`}
                        >
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
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-[var(--color-fg-3)] tnum">
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
                  <tr className="border-b border-[var(--color-border)] text-[12px]">
                    <ColumnHeader
                      label="Statut"
                      className="w-[210px]"
                      sortKey="status"
                      filter={{ type: "select", param: "status", options: statusOptions }}
                    />
                    <ColumnHeader label="Dossier" sortKey="number" filter={{ type: "text", param: "number" }} />
                    <ColumnHeader label="Référence" sortKey="reference" filter={{ type: "text", param: "reference" }} />
                    <ColumnHeader label="Client" sortKey="client" filter={{ type: "text", param: "clientName" }} />
                    <ColumnHeader label="DUM(s)" filter={{ type: "text", param: "dum" }} />
                    <ColumnHeader label="Documents" shortLabel="Docs" align="center" sortKey="docs" />
                    <ColumnHeader label="Visite / Livraison" sortKey="visit" />
                    <ColumnHeader label="Valeur" align="right" sortKey="value" />
                    <ColumnHeader label="Poids" align="right" sortKey="weight" />
                    <ColumnHeader label="M.à.j" align="right" sortKey="updatedAt" />
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
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-danger)] text-white" title="Nouveau dossier créé par le client">
                              NOUVEAU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/dossiers/${d.id}`}
                          className="font-mono font-semibold text-[13px] text-[var(--color-fg)] hover:text-[var(--color-accent)]"
                        >
                          {d.number}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[13px] text-[var(--color-fg-2)]">
                        {d.reference ?? <span className="text-[var(--color-fg-mute)] italic">—</span>}
                      </td>
                      <td className="px-5 py-2.5 truncate max-w-[200px] text-[13px] text-[var(--color-fg-3)]">
                        {d.client.name}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[13px] text-[var(--color-fg-3)]">
                        {d.dums.length === 0 ? "—" : d.dums.map((dum) => dum.number).join(", ")}
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-center whitespace-nowrap">
                          {d.fromClientCount > 0 && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-info-soft)] text-[var(--color-info)] cursor-default"
                              title={`Reçus du client :\n• ${d.fromClientDocs.join("\n• ")}`}
                            >
                              ● {d.fromClientCount}
                            </span>
                          )}
                          {d.missingCount > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)] cursor-default"
                              title={`Documents manquants :\n• ${d.missingDocs.join("\n• ")}`}
                            >
                              <AlertTriangle className="size-2.5" strokeWidth={2.25} />
                              {d.missingCount}
                            </span>
                          ) : d.fromClientCount === 0 ? (
                            <span
                              className="text-[13px] font-semibold text-[var(--color-success)] tnum"
                              title="Tous les documents requis sont présents"
                            >
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
                          <span className="text-[12px] text-[var(--color-fg-mute)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[13px] text-[var(--color-fg-3)] whitespace-nowrap">
                        {formatCurrency(
                          d.goodsValue ? Number(d.goodsValue) : null,
                          d.goodsCurrency ?? "EUR",
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[13px] text-[var(--color-fg-3)] whitespace-nowrap">
                        {d.goodsWeight ? `${formatNumber(Number(d.goodsWeight))} kg` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[13px] text-[var(--color-fg-3)] whitespace-nowrap">
                        {formatDate(d.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={size}
              total={total}
              basePath="/dossiers"
              extraParams={{
                status: params.status,
                number: params.number,
                reference: params.reference,
                clientName: params.clientName,
                dum: params.dum,
                client: params.client,
                sort: params.sort,
                dir: params.dir,
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
