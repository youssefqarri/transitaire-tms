import Link from "next/link";
import { Folder, Plus, Filter, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { canCreateDossier } from "@/lib/roles";
import { STATUS_LABELS } from "@/lib/statuses";
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
    include: { client: true, dums: true, _count: { select: { documents: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dossiers</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}
            {q ? ` correspondant à "${q}"` : ""}
          </p>
        </div>
        {canCreateDossier(session.user.role) && (
          <Link href="/dossiers/nouveau">
            <Button>
              <Plus className="size-4" /> Nouveau dossier
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <form
          method="GET"
          className="p-4 flex flex-wrap items-center gap-3 border-b border-[var(--color-border)]"
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted-foreground)]" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="N° dossier, DUM, client, référence…"
              className="w-full h-9 pl-9 pr-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
          </div>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="h-9 px-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm">
            <Filter className="size-4" /> Filtrer
          </Button>
        </form>

        {dossiers.length === 0 ? (
          <div className="p-16 text-center">
            <Folder className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucun dossier</div>
            <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {q ? "Aucun résultat pour cette recherche." : "Créez votre premier dossier pour commencer."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
                  <th className="text-left font-medium px-5 py-3">N°</th>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-5 py-3">Référence</th>
                  <th className="text-left font-medium px-5 py-3">DUM(s)</th>
                  <th className="text-right font-medium px-5 py-3">Valeur</th>
                  <th className="text-right font-medium px-5 py-3">Colis</th>
                  <th className="text-right font-medium px-5 py-3">Poids</th>
                  <th className="text-left font-medium px-5 py-3">Docs</th>
                  <th className="text-left font-medium px-5 py-3">Statut</th>
                  <th className="text-right font-medium px-5 py-3">Maj</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link href={`/dossiers/${d.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                        {d.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 truncate max-w-[200px]">{d.client.name}</td>
                    <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                      {d.reference ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {d.dums.length === 0 ? (
                        <span className="text-[var(--color-muted-foreground)]">—</span>
                      ) : (
                        d.dums.map((dum) => dum.number).join(", ")
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatCurrency(
                        d.goodsValue ? Number(d.goodsValue) : null,
                        d.goodsCurrency ?? "EUR",
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {formatNumber(d.goodsPackages)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[var(--color-muted-foreground)]">
                      {d.goodsWeight ? `${formatNumber(Number(d.goodsWeight))} kg` : "—"}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                      {d._count.documents}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                      {formatDate(d.updatedAt)}
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
