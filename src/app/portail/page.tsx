import Link from "next/link";
import { Folder } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour, {session.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Voici vos dossiers en cours.
        </p>
      </div>

      <Card>
        {dossiers.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--color-muted-foreground)]">
            Aucun dossier pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {dossiers.map((d) => (
              <Link
                key={d.id}
                href={`/portail/${d.id}`}
                className="flex items-center gap-4 p-5 hover:bg-[var(--color-muted)] transition-colors"
              >
                <div className="size-10 rounded-lg bg-gradient-to-br from-[oklch(85%_0.08_258)] to-[oklch(70%_0.12_280)] flex items-center justify-center text-white">
                  <Folder className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{d.number}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {d.reference ? `Réf. ${d.reference} · ` : ""}
                    {d._count.documents} document{d._count.documents > 1 ? "s" : ""} ·{" "}
                    {formatDate(d.updatedAt)}
                  </div>
                </div>
                <div className="hidden sm:block text-right text-xs text-[var(--color-muted-foreground)]">
                  {formatCurrency(
                    d.goodsValue ? Number(d.goodsValue) : null,
                    d.goodsCurrency ?? "EUR",
                  )}
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
