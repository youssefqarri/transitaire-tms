import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DUM_STATUS_LABELS } from "@/lib/statuses";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DUMsPage() {
  const dums = await prisma.dUM.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      dossier: { include: { client: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="DUMs"
        subtitle={`${dums.length} déclaration${dums.length > 1 ? "s" : ""}`}
      />
      <Card>
        {dums.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune DUM"
            hint="Les DUMs sont créées depuis chaque dossier."
          />
        ) : (
          <>
            {/* Mobile: cartes */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {dums.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.dossier.id}`}
                  className="block px-4 py-3 hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="font-mono font-medium text-[14px] text-[var(--color-fg)]">
                      {d.number}
                    </span>
                    <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
                  </div>
                  <div className="text-[12.5px] text-[var(--color-fg-2)]">
                    <span className="font-mono">{d.dossier.number}</span> · {d.dossier.client.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-fg-3)] mt-1">
                    <span>{d.bureau ?? "Bureau ?"}</span>
                    <span>{formatDate(d.registeredAt)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[11.5px] font-medium text-[var(--color-fg-3)]">
                    <th className="text-left px-5 py-2.5">N° DUM</th>
                    <th className="text-left px-5 py-2.5">Dossier</th>
                    <th className="text-left px-5 py-2.5">Client</th>
                    <th className="text-left px-5 py-2.5">Bureau</th>
                    <th className="text-left px-5 py-2.5">Statut</th>
                    <th className="text-right px-5 py-2.5">Enregistré</th>
                  </tr>
                </thead>
                <tbody>
                  {dums.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)]/50"
                    >
                      <td className="px-5 py-2.5 font-medium">{d.number}</td>
                      <td className="px-5 py-2.5">
                        <Link
                          className="text-[var(--color-accent)] hover:underline"
                          href={`/dossiers/${d.dossier.id}`}
                        >
                          {d.dossier.number}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link
                          className="text-[var(--color-accent)] hover:underline"
                          href={`/clients/${d.dossier.client.id}`}
                        >
                          {d.dossier.client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--color-fg-3)]">
                        {d.bureau ?? "—"}
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11.5px] text-[var(--color-fg-3)]">
                        {formatDate(d.registeredAt)}
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
