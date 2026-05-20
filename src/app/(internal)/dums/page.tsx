import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DUMs</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          {dums.length} déclaration{dums.length > 1 ? "s" : ""}
        </p>
      </div>
      <Card>
        {dums.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucune DUM</div>
            <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Les DUMs sont créées depuis chaque dossier.
            </div>
          </div>
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
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-fg-mute)] mt-1">
                    <span>{d.bureau ?? "Bureau ?"}</span>
                    <span>{formatDate(d.registeredAt)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    <th className="text-left font-medium px-5 py-3">N° DUM</th>
                    <th className="text-left font-medium px-5 py-3">Dossier</th>
                    <th className="text-left font-medium px-5 py-3">Client</th>
                    <th className="text-left font-medium px-5 py-3">Bureau</th>
                    <th className="text-left font-medium px-5 py-3">Statut</th>
                    <th className="text-right font-medium px-5 py-3">Enregistré</th>
                  </tr>
                </thead>
                <tbody>
                  {dums.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50"
                    >
                      <td className="px-5 py-3 font-medium">{d.number}</td>
                      <td className="px-5 py-3">
                        <Link
                          className="text-[var(--color-primary)] hover:underline"
                          href={`/dossiers/${d.dossier.id}`}
                        >
                          {d.dossier.number}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          className="text-[var(--color-primary)] hover:underline"
                          href={`/clients/${d.dossier.client.id}`}
                        >
                          {d.dossier.client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[var(--color-muted-foreground)]">
                        {d.bureau ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="info">{DUM_STATUS_LABELS[d.status]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-[var(--color-muted-foreground)]">
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
