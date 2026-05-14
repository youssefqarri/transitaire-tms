import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
    <div className="space-y-12 animate-fade-up">
      <header className="pb-8 border-b border-[var(--color-rule-strong)]">
        <div className="label-eyebrow mb-3">— Portail client</div>
        <h1
          className="font-display text-[56px] leading-[0.95] tracking-[-0.025em]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
        >
          Bonjour {session.user.name.split(" ")[0]}
          <span className="text-[var(--color-stamp)]">,</span>{" "}
          <em
            style={{
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 144, "SOFT" 90, "wght" 350',
            }}
          >
            voici vos dossiers
          </em>
          .
        </h1>
        <p className="mt-4 text-[15px] text-[var(--color-ink-soft)] max-w-2xl leading-relaxed">
          Cette page récapitule l'ensemble de vos dossiers en cours auprès de notre maison de transit.
          Cliquez sur un dossier pour consulter son avancement détaillé et ses pièces.
        </p>
      </header>

      <section>
        <div className="border-t border-b border-[var(--color-rule-strong)]">
          {dossiers.length === 0 && (
            <div className="py-20 text-center font-display italic text-[18px] text-[var(--color-ink-mute)]">
              Aucun dossier pour le moment.
            </div>
          )}
          {dossiers.map((d, idx) => (
            <Link
              key={d.id}
              href={`/portail/${d.id}`}
              className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-6 py-5 px-1 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-paper-strong)] transition-colors"
            >
              <span className="font-mono text-[11px] tabular text-[var(--color-ink-mute)] w-8">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono text-[16px] tabular text-[var(--color-ink)] group-hover:underline underline-offset-3 decoration-[var(--color-rule-strong)]">
                    {d.number}
                  </span>
                  {d.reference && (
                    <span className="font-mono text-[11px] text-[var(--color-ink-mute)]">
                      · {d.reference}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] mt-1">
                  {d._count.documents} pièce{d._count.documents > 1 ? "s" : ""} · Mise à jour {formatDate(d.updatedAt)}
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="font-mono text-[14px] tabular text-[var(--color-ink)]">
                  {formatCurrency(
                    d.goodsValue ? Number(d.goodsValue) : null,
                    d.goodsCurrency ?? "EUR",
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.status} size="sm" />
                <ArrowUpRight className="size-3.5 text-[var(--color-ink-mute)] group-hover:text-[var(--color-ink)]" strokeWidth={1.5} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
