import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
    <div className="space-y-10 animate-fade-up">
      {/* ── En-tête ── */}
      <header className="flex items-end justify-between gap-6 flex-wrap pb-6 border-b border-[var(--color-rule-strong)]">
        <div>
          <div className="label-eyebrow mb-3">— Section 02 · Dossiers</div>
          <h1
            className="font-display text-[52px] leading-[0.95] tracking-[-0.025em]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
          >
            Registre des dossiers
          </h1>
          <p className="mt-3 text-[14px] text-[var(--color-ink-soft)]">
            {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} affiché
            {dossiers.length > 1 ? "s" : ""}
            {q ? (
              <>
                {" "}
                · recherche{" "}
                <em className="font-display italic text-[var(--color-ink)]">« {q} »</em>
              </>
            ) : (
              ""
            )}
          </p>
        </div>
        {canCreateDossier(session.user.role) && (
          <Link href="/dossiers/nouveau">
            <Button>
              <Plus className="size-3.5" /> Nouveau dossier
            </Button>
          </Link>
        )}
      </header>

      {/* ── Filtres ── */}
      <form method="GET" className="flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[280px]">
          <label className="label-eyebrow block mb-2">Recherche</label>
          <div className="relative flex items-center">
            <Search className="absolute left-0 size-3.5 text-[var(--color-ink-mute)]" strokeWidth={1.5} />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="N° dossier, DUM, client, référence…"
              className="w-full h-9 pl-6 pr-3 text-[14px] bg-transparent border-0 border-b border-[var(--color-rule-strong)] rounded-none focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
        </div>
        <div className="min-w-[220px]">
          <label className="label-eyebrow block mb-2">Statut</label>
          <Select name="status" defaultValue={params.status ?? ""}>
            <option value="">Tous</option>
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" size="sm" type="submit">Filtrer</Button>
      </form>

      {/* ── Table ── */}
      {dossiers.length === 0 ? (
        <div className="py-24 text-center border-t border-b border-[var(--color-rule-strong)]">
          <div className="font-display text-[24px] italic text-[var(--color-ink-mute)]">
            {q ? "Aucun résultat." : "Le registre est vide."}
          </div>
          <div className="text-[13px] text-[var(--color-ink-mute)] mt-2">
            {q
              ? "Essayez un autre terme de recherche."
              : "Ouvrez le premier dossier pour commencer."}
          </div>
        </div>
      ) : (
        <div className="border-t border-b border-[var(--color-rule-strong)] overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-rule)]">
                {[
                  ["N°", "left"],
                  ["Dossier", "left"],
                  ["Client", "left"],
                  ["Référence", "left"],
                  ["DUM(s)", "left"],
                  ["Valeur", "right"],
                  ["Colis", "right"],
                  ["Poids", "right"],
                  ["Docs", "right"],
                  ["Statut", "left"],
                  ["Maj", "right"],
                ].map(([label, align]) => (
                  <th
                    key={label}
                    className={`font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] font-medium px-4 py-3 ${
                      align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d, idx) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--color-rule)] last:border-0 hover:bg-[var(--color-paper-strong)] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[10.5px] text-[var(--color-ink-mute)] tabular">
                    {String(idx + 1).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dossiers/${d.id}`}
                      className="font-mono tabular link-edit"
                    >
                      {d.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-display italic">{d.client.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[var(--color-ink-soft)]">
                    {d.reference ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] tabular">
                    {d.dums.length === 0 ? (
                      <span className="text-[var(--color-ink-mute)]">—</span>
                    ) : (
                      d.dums.map((dum) => dum.number).join(", ")
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[13px]">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[12px] text-[var(--color-ink-soft)]">
                    {formatNumber(d.goodsPackages)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[12px] text-[var(--color-ink-soft)]">
                    {d.goodsWeight ? `${formatNumber(Number(d.goodsWeight))} kg` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[12px] text-[var(--color-ink-soft)]">
                    {String(d._count.documents).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] tabular whitespace-nowrap">
                    {formatDate(d.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
