import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dossier/status-badge";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  DOCUMENT_CATEGORY_LABELS,
  requiredDocuments,
} from "@/lib/statuses";
import { formatDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user.clientId) return null;

  const dossier = await prisma.dossier.findFirst({
    where: { id, clientId: session.user.clientId },
    include: {
      dums: true,
      documents: { orderBy: { receivedAt: "desc" } },
      comments: {
        where: { internal: false },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      statusChanges: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!dossier) notFound();

  const required = requiredDocuments(dossier.paymentMode);
  const presentCats = new Set(dossier.documents.map((d) => d.category));
  const missing = required.filter((c) => !presentCats.has(c));
  const progressIndex = STATUS_ORDER.indexOf(dossier.status);
  const totalSteps = STATUS_ORDER.length;
  const progressPct = progressIndex >= 0 ? ((progressIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="space-y-12 animate-fade-up">
      <Link
        href="/portail"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="size-3" strokeWidth={1.5} /> Mes dossiers
      </Link>

      <header className="pb-8 border-b border-[var(--color-rule-strong)]">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <span className="label-eyebrow text-[var(--color-ink)]">
            — Dossier · réf. {dossier.reference ?? "—"}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)] tabular">
            Ouvert le {formatDate(dossier.createdAt)}
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1
              className="font-display text-[60px] leading-[0.92] tracking-[-0.028em] tabular"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
            >
              {dossier.number}
            </h1>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <StatusBadge status={dossier.status} />
              <Badge tone={dossier.type === "IMPORT" ? "info" : "ok"}>{dossier.type}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="label-eyebrow mb-1">Valeur</div>
            <div className="font-display text-[28px] tabular tracking-tight">
              {formatCurrency(
                dossier.goodsValue ? Number(dossier.goodsValue) : null,
                dossier.goodsCurrency ?? "EUR",
              )}
            </div>
          </div>
        </div>

        {/* progression */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-2">
            <span className="label-eyebrow">Avancement</span>
            <span className="font-mono text-[12px] tabular text-[var(--color-ink)]">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-[3px] bg-[var(--color-rule)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-ink)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {missing.length > 0 && (
        <section className="border-l-2 border-[var(--color-stamp)] pl-6 py-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <AlertCircle className="size-4 text-[var(--color-stamp)]" strokeWidth={1.5} />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-stamp)]">
              Documents à fournir
            </span>
          </div>
          <p className="mt-2 text-[14px] text-[var(--color-ink-soft)] leading-relaxed max-w-xl">
            Merci de transmettre les pièces suivantes à notre équipe afin de poursuivre le
            traitement de votre dossier :
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {missing.map((c) => (
              <Badge tone="warn" key={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12">
        <section>
          <h2
            className="font-display text-[28px] tracking-[-0.018em] mb-4"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
          >
            Pièces du dossier
          </h2>
          <div className="border-t border-b border-[var(--color-rule-strong)]">
            {dossier.documents.length === 0 && (
              <div className="py-10 text-center text-[14px] text-[var(--color-ink-mute)] font-display italic">
                Aucune pièce disponible.
              </div>
            )}
            {dossier.documents.map((d, idx) => (
              <div
                key={d.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 px-1 border-b border-[var(--color-rule)] last:border-b-0"
              >
                <span className="font-mono text-[10px] text-[var(--color-ink-mute)] tabular w-6">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <FileText className="size-3.5 text-[var(--color-ink-mute)]" strokeWidth={1.5} />
                    <span className="text-[14px]">{d.name}</span>
                  </div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] mt-1">
                    {DOCUMENT_CATEGORY_LABELS[d.category]} · {formatDate(d.receivedAt)}
                  </div>
                </div>
                {d.fileUrl ? (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink)] hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="size-3" strokeWidth={1.5} /> Télécharger
                  </a>
                ) : (
                  <span className="font-mono text-[10.5px] text-[var(--color-ink-mute)]">—</span>
                )}
              </div>
            ))}
          </div>

          {dossier.comments.length > 0 && (
            <div className="mt-12">
              <h2
                className="font-display text-[28px] tracking-[-0.018em] mb-4"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
              >
                Messages
              </h2>
              <div className="border-t border-b border-[var(--color-rule-strong)]">
                {dossier.comments.map((c) => (
                  <div key={c.id} className="py-4 border-b border-[var(--color-rule)] last:border-b-0">
                    <div className="text-[14px] leading-relaxed">{c.body}</div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                      <span className="font-sans italic font-display normal-case tracking-normal text-[12px]">
                        {c.author.name}
                      </span>{" "}
                      · {formatDate(c.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside>
          <h2
            className="font-display text-[26px] tracking-[-0.018em] mb-4"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
          >
            Chronologie
          </h2>
          <ol className="border-t border-[var(--color-rule-strong)]">
            {dossier.statusChanges.map((sc) => (
              <li key={sc.id} className="py-3 border-b border-[var(--color-rule)] last:border-b-0">
                <div className="text-[14px] text-[var(--color-ink)]">
                  {STATUS_LABELS[sc.toStatus]}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] tabular mt-0.5">
                  {formatDate(sc.createdAt)}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
