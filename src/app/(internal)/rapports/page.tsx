import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, ListChecks, Users, Landmark } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { orgScope } from "@/lib/tenant";
import { canViewInvoices } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMAD } from "@/lib/invoicing";
import { STATUS_LABELS } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

// Libellé court d'un mois (« janv. 2026 ») à partir d'une clé "YYYY-MM".
function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(
    new Date(y, m - 1, 1),
  );
}

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

export default async function RapportsPage() {
  const session = await auth();
  if (!session) return null;
  if (!canViewInvoices(session.user.role)) redirect("/dashboard");

  const orgId = session.user.orgId;

  // ────────────────────────────────────────────────────────────────────────
  // 1) Chiffre d'affaires (honoraires) — 12 derniers mois.
  //    On lit les lignes HONORAIRE dont la facture appartient à l'org (scope via
  //    la relation `invoice`) et dont la facture a une date d'émission dans la
  //    fenêtre. On agrège par mois d'émission en JS (quantity × unitPrice).
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 1er du mois, 12 mois glissants

  // Construit la liste ordonnée des 12 clés de mois "YYYY-MM".
  const monthKeys: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const honoraireItems = await prisma.invoiceItem.findMany({
    where: {
      kind: "HONORAIRE",
      // scope org via la facture parente (InvoiceItem n'a pas d'orgId propre)
      invoice: {
        ...orgScope(orgId),
        status: { notIn: ["DRAFT", "CANCELLED"] },
        issuedAt: { gte: windowStart },
      },
    },
    select: {
      quantity: true,
      unitPrice: true,
      invoice: { select: { issuedAt: true } },
    },
  });

  const caByMonth = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const it of honoraireItems) {
    const issued = it.invoice.issuedAt;
    if (!issued) continue;
    const key = `${issued.getFullYear()}-${String(issued.getMonth() + 1).padStart(2, "0")}`;
    if (caByMonth.has(key)) caByMonth.set(key, caByMonth.get(key)! + num(it.quantity) * num(it.unitPrice));
  }
  const caSeries = monthKeys.map((k) => ({ key: k, label: monthLabel(k), value: caByMonth.get(k) ?? 0 }));
  const caMax = Math.max(1, ...caSeries.map((p) => p.value));
  const caTotal = caSeries.reduce((s, p) => s + p.value, 0);

  // ────────────────────────────────────────────────────────────────────────
  // 2) Dossiers par statut — count des dossiers de l'org groupés par statut.
  const byStatusRaw = await prisma.dossier.groupBy({
    by: ["status"],
    where: { ...orgScope(orgId) },
    _count: { _all: true },
    orderBy: { _count: { status: "desc" } },
  });
  const statusRows = byStatusRaw
    .map((r) => ({
      status: r.status as DossierStatus,
      label: STATUS_LABELS[r.status as DossierStatus],
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);
  const statusMax = Math.max(1, ...statusRows.map((r) => r.count));

  // ────────────────────────────────────────────────────────────────────────
  // 3) Top clients — top 5 par nombre de dossiers, scope org via Dossier.orgId.
  const topClientsRaw = await prisma.dossier.groupBy({
    by: ["clientId"],
    where: { ...orgScope(orgId) },
    _count: { _all: true },
    orderBy: { _count: { clientId: "desc" } },
    take: 5,
  });
  const clientNames = await prisma.client.findMany({
    where: { ...orgScope(orgId), id: { in: topClientsRaw.map((r) => r.clientId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(clientNames.map((c) => [c.id, c.name]));
  const topClients = topClientsRaw.map((r) => ({
    id: r.clientId,
    name: nameById.get(r.clientId) ?? "—",
    count: r._count._all,
  }));

  // ────────────────────────────────────────────────────────────────────────
  // 4) Volume douane par bureau — la DUM n'a pas d'orgId ; on la scope via le
  //    dossier parent (dossier.orgId). Agrégat en JS (nb, Σ valeur, Σ droits).
  const dums = await prisma.dUM.findMany({
    where: { dossier: { ...orgScope(orgId) } },
    select: { bureau: true, customsValue: true, liquidatedDuties: true },
  });
  const bureauMap = new Map<
    string,
    { bureau: string; count: number; customsValue: number; liquidatedDuties: number }
  >();
  for (const d of dums) {
    const bureau = d.bureau?.trim() || "Non renseigné";
    const row =
      bureauMap.get(bureau) ?? { bureau, count: 0, customsValue: 0, liquidatedDuties: 0 };
    row.count += 1;
    row.customsValue += num(d.customsValue);
    row.liquidatedDuties += num(d.liquidatedDuties);
    bureauMap.set(bureau, row);
  }
  const bureauRows = [...bureauMap.values()].sort((a, b) => b.count - a.count);
  const dumTotals = bureauRows.reduce(
    (s, r) => ({
      count: s.count + r.count,
      customsValue: s.customsValue + r.customsValue,
      liquidatedDuties: s.liquidatedDuties + r.liquidatedDuties,
    }),
    { count: 0, customsValue: 0, liquidatedDuties: 0 },
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rapports"
        subtitle="Vue d'ensemble de l'activité — chiffre d'affaires, dossiers et volume douane"
      />

      {/* 1) Chiffre d'affaires (honoraires) — 12 derniers mois */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-[var(--color-accent)]" strokeWidth={1.75} />
            Chiffre d'affaires (honoraires) — 12 derniers mois
          </CardTitle>
          <span className="text-[13px] tnum text-[var(--color-fg-3)]">
            Total&nbsp;: <span className="font-medium text-[var(--color-fg)]">{formatMAD(caTotal)}</span>
          </span>
        </CardHeader>
        <CardContent>
          {caTotal === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Aucun honoraire facturé"
              hint="Les honoraires des factures émises apparaîtront ici, mois par mois."
            />
          ) : (
            <div className="flex items-end gap-2 sm:gap-3 h-56 pt-2">
              {caSeries.map((p) => {
                const pct = (p.value / caMax) * 100;
                return (
                  <div
                    key={p.key}
                    className="group flex-1 flex flex-col items-center justify-end gap-2 h-full min-w-0"
                    title={`${p.label} — ${formatMAD(p.value)}`}
                  >
                    <div className="relative flex-1 w-full flex items-end justify-center">
                      {/* montant au survol */}
                      <span className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] tnum font-medium text-[var(--color-fg)] whitespace-nowrap pointer-events-none">
                        {formatMAD(p.value)}
                      </span>
                      <div
                        className="w-full max-w-[44px] rounded-t-[var(--radius-md)] bg-[var(--color-accent)]/85 group-hover:bg-[var(--color-accent)] transition-all"
                        style={{ height: `${Math.max(pct, p.value > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--color-fg-3)] whitespace-nowrap tabular-nums">
                      {p.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2) Dossiers par statut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4 text-[var(--color-accent)]" strokeWidth={1.75} />
            Dossiers par statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusRows.length === 0 ? (
            <EmptyState icon={ListChecks} title="Aucun dossier" hint="Aucun dossier à répartir par statut." />
          ) : (
            <div className="space-y-2.5">
              {statusRows.map((r) => (
                <div key={r.status} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-[13px] text-[var(--color-fg-3)] truncate" title={r.label}>
                    {r.label}
                  </span>
                  <div className="flex-1 h-5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-[var(--radius-md)] bg-[var(--color-accent)]/85"
                      style={{ width: `${(r.count / statusMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-[13px] tnum font-medium text-[var(--color-fg)]">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3) Top clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-[var(--color-accent)]" strokeWidth={1.75} />
            Top clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topClients.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState icon={Users} title="Aucun client" hint="Les clients avec des dossiers apparaîtront ici." />
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-fg-3)]">
                  <th className="px-5 py-2.5 text-left font-medium">Client</th>
                  <th className="px-5 py-2.5 text-right font-medium">Dossiers</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2.5 text-[var(--color-fg)] truncate max-w-[320px]">{c.name}</td>
                    <td className="px-5 py-2.5 text-right tnum font-medium text-[var(--color-fg)]">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 4) Volume douane par bureau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4 text-[var(--color-accent)]" strokeWidth={1.75} />
            Volume douane
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bureauRows.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState icon={Landmark} title="Aucune DUM" hint="Le volume par bureau douanier apparaîtra ici." />
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-fg-3)]">
                  <th className="px-5 py-2.5 text-left font-medium">Bureau</th>
                  <th className="px-5 py-2.5 text-right font-medium">DUM</th>
                  <th className="px-5 py-2.5 text-right font-medium">Valeur en douane</th>
                  <th className="px-5 py-2.5 text-right font-medium">Droits liquidés</th>
                </tr>
              </thead>
              <tbody>
                {bureauRows.map((r) => (
                  <tr key={r.bureau} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2.5 font-medium text-[var(--color-fg)]">{r.bureau}</td>
                    <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg)]">{r.count}</td>
                    <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg)]">
                      {formatMAD(r.customsValue)}
                    </td>
                    <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg)]">
                      {formatMAD(r.liquidatedDuties)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/40">
                  <td className="px-5 py-2.5 font-medium text-[var(--color-fg-3)]">Total</td>
                  <td className="px-5 py-2.5 text-right tnum font-medium text-[var(--color-fg)]">
                    {dumTotals.count}
                  </td>
                  <td className="px-5 py-2.5 text-right tnum font-medium text-[var(--color-fg)]">
                    {formatMAD(dumTotals.customsValue)}
                  </td>
                  <td className="px-5 py-2.5 text-right tnum font-medium text-[var(--color-fg)]">
                    {formatMAD(dumTotals.liquidatedDuties)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
