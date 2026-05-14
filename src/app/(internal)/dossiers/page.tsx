import Link from "next/link";
import { Folder, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Dossiers</h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
            {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}
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

        {dossiers.length === 0 ? (
          <div className="py-16 text-center">
            <Folder className="size-8 mx-auto text-[var(--color-fg-mute)] mb-2" strokeWidth={1.5} />
            <div className="text-[14px] font-medium">Aucun dossier</div>
            <div className="text-[12.5px] text-[var(--color-fg-3)] mt-1">
              {q ? "Aucun résultat pour cette recherche." : "Créez votre premier dossier pour commencer."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[11.5px] font-medium text-[var(--color-fg-3)]">
                  <th className="text-left px-5 py-2.5">Dossier</th>
                  <th className="text-left px-5 py-2.5">Client</th>
                  <th className="text-left px-5 py-2.5">Référence</th>
                  <th className="text-left px-5 py-2.5">DUM(s)</th>
                  <th className="text-right px-5 py-2.5">Valeur</th>
                  <th className="text-right px-5 py-2.5">Colis</th>
                  <th className="text-right px-5 py-2.5">Poids</th>
                  <th className="text-right px-5 py-2.5">Docs</th>
                  <th className="text-left px-5 py-2.5">Statut</th>
                  <th className="text-right px-5 py-2.5">Maj</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/dossiers/${d.id}`}
                        className="font-mono font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]"
                      >
                        {d.number}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 truncate max-w-[200px] text-[var(--color-fg-2)]">
                      {d.client.name}
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-fg-3)] font-mono text-[12px]">
                      {d.reference ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-[12px] text-[var(--color-fg-3)]">
                      {d.dums.length === 0 ? "—" : d.dums.map((dum) => dum.number).join(", ")}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg)]">
                      {formatCurrency(
                        d.goodsValue ? Number(d.goodsValue) : null,
                        d.goodsCurrency ?? "EUR",
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg-3)]">
                      {formatNumber(d.goodsPackages)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tnum text-[var(--color-fg-3)]">
                      {d.goodsWeight ? `${formatNumber(Number(d.goodsWeight))} kg` : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg-3)]">
                      {d._count.documents}
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="px-5 py-2.5 text-right text-[11.5px] text-[var(--color-fg-mute)] whitespace-nowrap">
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
