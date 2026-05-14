import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StatusBadge } from "@/components/dossier/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import {
  STATUS_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  requiredDocuments,
} from "@/lib/statuses";
import { StatusChanger } from "./status-changer";
import { DocumentsPanel } from "./documents-panel";
import { DUMsPanel } from "./dums-panel";
import { CommentsPanel } from "./comments-panel";

export const dynamic = "force-dynamic";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: {
      client: true,
      supplier: true,
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      dums: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { receivedAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
      statusChanges: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!dossier) notFound();

  const required = requiredDocuments(dossier.paymentMode);
  const presentCategories = new Set(dossier.documents.map((d) => d.category));
  const missing = required.filter((c) => !presentCategories.has(c));

  return (
    <div className="space-y-12 animate-fade-up max-w-[1280px]">
      <Link
        href="/dossiers"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="size-3" strokeWidth={1.5} /> Retour au registre
      </Link>

      {/* ── Bandeau dossier (document officiel) ── */}
      <header className="relative pb-8 border-b border-[var(--color-rule-strong)]">
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
              className="font-display text-[68px] leading-[0.92] tracking-[-0.028em] tabular"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
            >
              {dossier.number}
            </h1>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <StatusBadge status={dossier.status} />
              <Badge tone={dossier.type === "IMPORT" ? "info" : "ok"}>{dossier.type}</Badge>
              {dossier.paymentMode === "WITH_PAYMENT" && (
                <Badge tone="outline">Avec paiement</Badge>
              )}
              {dossier.createdBy && (
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                  · Saisi par {dossier.createdBy.name}
                </span>
              )}
            </div>
          </div>
          <StatusChanger dossierId={dossier.id} currentStatus={dossier.status} />
        </div>
      </header>

      {/* ── Alerte documents manquants ── */}
      {missing.length > 0 && (
        <section className="border-l-2 border-[var(--color-stamp)] pl-6 py-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <AlertTriangle
              className="size-4 text-[var(--color-stamp)] shrink-0"
              strokeWidth={1.5}
            />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-stamp)]">
              {missing.length} document{missing.length > 1 ? "s" : ""} manquant
              {missing.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {missing.map((c) => (
              <Badge tone="warn" key={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* ── Métadonnées du dossier ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 pb-8 border-b border-[var(--color-rule-strong)]">
        <Field label="Client" value={<em className="font-display italic">{dossier.client.name}</em>} />
        <Field label="Fournisseur" value={dossier.supplier?.name ?? "—"} />
        <Field
          label="Valeur"
          mono
          value={formatCurrency(
            dossier.goodsValue ? Number(dossier.goodsValue) : null,
            dossier.goodsCurrency ?? "EUR",
          )}
        />
        <Field
          label="Poids"
          mono
          value={dossier.goodsWeight ? `${formatNumber(Number(dossier.goodsWeight))} kg` : "—"}
        />
        <Field label="Colis" mono value={formatNumber(dossier.goodsPackages)} />
        <Field label="Bureau" value={dossier.controlOffice ?? "—"} />
        <Field label="Visite" mono value={formatDate(dossier.visitDate)} />
        <Field label="Assigné" value={dossier.assignedTo?.name ?? "—"} />
        {dossier.goodsDescription && (
          <div className="md:col-span-4">
            <div className="label-eyebrow mb-2">Description marchandise</div>
            <div className="text-[14px] text-[var(--color-ink)] leading-relaxed">
              {dossier.goodsDescription}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
        <div className="space-y-10">
          <DUMsPanel
            dossierId={dossier.id}
            dums={dossier.dums}
            canCreate={["ADMIN", "DECLARANT"].includes(session.user.role)}
          />
          <DocumentsPanel
            dossierId={dossier.id}
            documents={dossier.documents.map((d) => ({
              ...d,
              uploadedByName: d.uploadedBy?.name ?? null,
            }))}
            requiredCategories={required}
          />
          <CommentsPanel
            dossierId={dossier.id}
            comments={dossier.comments.map((c) => ({
              id: c.id,
              body: c.body,
              internal: c.internal,
              createdAt: c.createdAt,
              authorName: c.author.name,
            }))}
          />
        </div>

        <aside>
          <h2
            className="font-display text-[26px] tracking-[-0.018em] mb-4"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
          >
            Chronologie
          </h2>
          <ol className="border-t border-[var(--color-rule-strong)]">
            {dossier.statusChanges.map((sc) => (
              <li key={sc.id} className="py-3.5 border-b border-[var(--color-rule)] last:border-b-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[14px] text-[var(--color-ink)] font-medium">
                    {STATUS_LABELS[sc.toStatus]}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] tabular whitespace-nowrap">
                    {formatDateTime(sc.createdAt)}
                  </div>
                </div>
                {sc.changedBy && (
                  <div className="text-[12px] text-[var(--color-ink-mute)] mt-0.5">
                    par <span className="font-display italic">{sc.changedBy.name}</span>
                  </div>
                )}
                {sc.note && (
                  <div className="mt-1.5 text-[13px] text-[var(--color-ink-soft)] italic font-display leading-snug">
                    « {sc.note} »
                  </div>
                )}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="label-eyebrow mb-1.5">{label}</div>
      <div
        className={
          mono
            ? "font-mono text-[15px] tabular text-[var(--color-ink)]"
            : "text-[15px] text-[var(--color-ink)]"
        }
      >
        {value}
      </div>
    </div>
  );
}
