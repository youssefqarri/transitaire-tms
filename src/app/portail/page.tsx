import Link from "next/link";
import { Folder, ChevronRight, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/dossier/status-badge";
import { KeyDates } from "@/components/dossier/key-dates";
import { formatDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await auth();
  if (!session?.user.clientId) return null;
  const dossiers = await prisma.dossier.findMany({
    where: { clientId: session.user.clientId },
    orderBy: { updatedAt: "desc" },
    include: { dums: true, _count: { select: { documents: true } } },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mes dossiers"
        subtitle={`Bonjour ${session.user.name.split(" ")[0]}, voici l'état de vos dossiers en cours.`}
        actions={
          <Link href="/portail/nouveau">
            <Button>
              <Plus /> Nouveau dossier
            </Button>
          </Link>
        }
      />

      <Card>
        {dossiers.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="Aucun dossier pour le moment"
            hint="Créez votre premier dossier pour commencer le suivi."
            cta={
              <Link href="/portail/nouveau">
                <Button size="sm">
                  <Plus /> Créer mon premier dossier
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {dossiers.map((d) => (
              <Link
                key={d.id}
                href={`/portail/${d.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[13.5px] font-medium text-[var(--color-fg)]">
                      {d.number}
                    </span>
                    {d.reference && (
                      <span className="text-[12px] text-[var(--color-fg-mute)]">
                        · {d.reference}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                    {d._count.documents} document{d._count.documents > 1 ? "s" : ""} · Mis à jour le{" "}
                    {formatDate(d.updatedAt)}
                  </div>
                </div>
                <div className="hidden sm:block shrink-0">
                  <KeyDates
                    visitDate={d.visitDate}
                    visitEffectiveDate={d.visitEffectiveDate}
                    conformityVisitDate={d.conformityVisitDate}
                    conformityVisitEffectiveDate={d.conformityVisitEffectiveDate}
                    deliveredAt={d.deliveredAt}
                  />
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <div className="font-mono text-[13px] text-[var(--color-fg)] tnum">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </div>
                </div>
                <StatusBadge status={d.status} size="sm" />
                <ChevronRight className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
