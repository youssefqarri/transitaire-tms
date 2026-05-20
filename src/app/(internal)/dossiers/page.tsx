import Link from "next/link";
import { Folder, Plus, Search, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { canCreateDossier } from "@/lib/roles";
import { STATUS_LABELS, requiredDocuments } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

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
      return {
        ...d,
        missingCount: missing.length,
        docCount: d.documents.length,
        fromClientCount,
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

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Dossiers</h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
            {enriched.length} dossier{enriched.length > 1 ? "s" : ""}
            {q && (
              <>
                {" "}· recherche <span className="text-[var(--color-fg)]">« {q} »</span>
              </>
            )}
          </p>
        </div>
        {canCreateDossier(session.user.role) && (
          <Link href="/dossiers/nouveau">
            <Button>
              <Plus /> Nouveau dossier
            </Button>
          </Link>
        )}
      </header>

      <Card>
        <form method="GET" className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <div className="relative flex-1 min-w-[260px]">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-mute)]"
              strokeWidth={1.75}
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="N° dossier, DUM, client, référence…"
              className="w-full h-9 pl-8 pr-3 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent"
            />
          </div>
          <div className="min-w-[200px]">
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" size="sm" type="submit">Filtrer</Button>
        </form>

        {enriched.length === 0 ? (
          <div className="py-16 text-center">
            <Folder className="size-8 mx-auto text-[var(--color-fg-mute)] mb-2" strokeWidth={1.5} />
            <div className="text-[14px] font-medium">Aucun dossier</div>
            <div className="text-[12.5px] text-[var(--color-fg-3)] mt-1">
              {q ? "Aucun résultat pour cette recherche." : "Créez votre premier dossier pour commencer."}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: liste en cartes empilées, statut + référence mis en avant */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {enriched.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="block px-4 py-3 hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)] transition-colors"
                >
                  {/* ligne 1 : statut large + numéro */}
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={d.status} />
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
                  <div className="flex items-center justify-between mt-1.5 text-[10.5px] text-[var(--color-fg-mute)] tnum">
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
                    <th className="text-right px-5 py-2.5 font-normal text-[var(--color-fg-mute)]">Valeur</th>
                    <th className="text-right px-5 py-2.5 font-normal text-[var(--color-fg-mute)]">Poids</th>
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
                        <StatusBadge status={d.status} size="sm" />
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
                      <td className="px-5 py-2.5 font-mono text-[11.5px] text-[var(--color-fg-mute)]">
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
                            <span className="text-[11px] text-[var(--color-fg-mute)] tnum">
                              {d.docCount}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[11.5px] text-[var(--color-fg-mute)]">
                        {formatCurrency(
                          d.goodsValue ? Number(d.goodsValue) : null,
                          d.goodsCurrency ?? "EUR",
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tnum text-[11.5px] text-[var(--color-fg-mute)]">
                        {d.goodsWeight ? `${formatNumber(Number(d.goodsWeight))} kg` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-[var(--color-fg-mute)] whitespace-nowrap">
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
