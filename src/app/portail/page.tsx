import Link from "next/link";
import { Folder, ChevronRight, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Mes dossiers</h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
            Bonjour {session.user.name.split(" ")[0]}, voici l&apos;état de vos dossiers en cours.
          </p>
        </div>
        <Link href="/portail/nouveau">
          <Button>
            <Plus /> Nouveau dossier
          </Button>
        </Link>
      </header>

      <Card>
        {dossiers.length === 0 ? (
          <div className="py-16 text-center">
            <Folder className="size-8 mx-auto text-[var(--color-fg-mute)] mb-2" strokeWidth={1.5} />
            <div className="text-[13px] text-[var(--color-fg-3)] mb-4">
              Aucun dossier pour le moment.
            </div>
            <Link href="/portail/nouveau">
              <Button size="sm">
                <Plus /> Créer mon premier dossier
              </Button>
            </Link>
          </div>
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
