import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dossier/status-badge";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  DOCUMENT_CATEGORY_LABELS,
  requiredDocuments,
  INTERNAL_ONLY_CATEGORIES,
} from "@/lib/statuses";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ClientUploadForm } from "./upload-form";
import { KeyDates } from "@/components/dossier/key-dates";

export const dynamic = "force-dynamic";

export default async function PortalDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user.clientId) return null;

  const dossier = await prisma.dossier.findFirst({
    where: { deletedAt: null, id, clientId: session.user.clientId },
    include: {
      dums: true,
      // le client ne voit pas les documents internes (fiche liquidation, ticket paiement…)
      documents: {
        where: { deletedAt: null, category: { notIn: INTERNAL_ONLY_CATEGORIES } },
        orderBy: { receivedAt: "desc" },
      },
      comments: {
        where: { internal: false },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      statusChanges: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!dossier) notFound();

  const required = requiredDocuments(dossier.paymentMode, dossier.transport);
  const presentCats = new Set(dossier.documents.map((d) => d.category));
  const missing = required.filter((c) => !presentCats.has(c));
  const progressIndex = STATUS_ORDER.indexOf(dossier.status);
  const totalSteps = STATUS_ORDER.length;
  const progressPct = progressIndex >= 0 ? ((progressIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="space-y-5">
      <Link
        href="/portail"
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Mes dossiers
      </Link>

      <Card>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[22px] font-semibold tracking-tight font-mono">
                  {dossier.number}
                </h1>
                <StatusBadge status={dossier.status} />
              </div>
              <p className="text-[12.5px] text-[var(--color-fg-3)]">
                {dossier.reference ? <>Réf. <span className="font-mono">{dossier.reference}</span> · </> : ""}
                Créé le {formatDate(dossier.createdAt)}
              </p>
              <KeyDates
                visitDate={dossier.visitDate}
                visitEffectiveDate={dossier.visitEffectiveDate}
                conformityVisitDate={dossier.conformityVisitDate}
                conformityVisitEffectiveDate={dossier.conformityVisitEffectiveDate}
                deliveredAt={dossier.deliveredAt}
                layout="row"
                size="md"
                className="pt-1"
              />
            </div>
            <div className="text-right">
              <div className="text-[11.5px] text-[var(--color-fg-3)]">Valeur</div>
              <div className="text-[18px] font-semibold font-mono tnum">
                {formatCurrency(
                  dossier.goodsValue ? Number(dossier.goodsValue) : null,
                  dossier.goodsCurrency ?? "EUR",
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11.5px] text-[var(--color-fg-3)] mb-1.5">
              <span>Avancement</span>
              <span className="tnum">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {missing.length > 0 && (
        <Card className="border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)]">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="size-4 text-[var(--color-warning)] shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Documents à fournir</div>
              <div className="text-[12.5px] text-[var(--color-fg-2)] mt-1 mb-3">
                Cliquez sur un type ci-dessous pour téléverser le document correspondant.
              </div>
              <ClientUploadForm dossierId={dossier.id} missing={missing} />
            </div>
          </div>
        </Card>
      )}

      {/* Bouton d'ajout de pièce complémentaire même sans documents manquants */}
      {missing.length === 0 && (
        <Card>
          <div className="p-4 flex items-start gap-3">
            <div className="flex-1">
              <div className="text-[13px] font-medium">Ajouter une pièce complémentaire</div>
              <div className="text-[12.5px] text-[var(--color-fg-3)] mt-1 mb-3">
                Tous les documents requis sont reçus. Vous pouvez néanmoins envoyer toute pièce
                supplémentaire utile à notre équipe.
              </div>
              <ClientUploadForm dossierId={dossier.id} missing={[]} />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <div className="divide-y divide-[var(--color-border)]">
            {dossier.documents.length === 0 && (
              <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
                Aucun document disponible.
              </div>
            )}
            {dossier.documents.map((d) => (
              <div key={d.id} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{d.name}</div>
                    <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                      {DOCUMENT_CATEGORY_LABELS[d.category]} · {formatDate(d.receivedAt)}
                    </div>
                  </div>
                  {d.fileUrl && (
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] text-[var(--color-accent)] hover:underline"
                    >
                      <Download className="size-3" strokeWidth={2} /> Télécharger
                    </a>
                  )}
                </div>
                {d.notes && (
                  <div className="ml-7 mt-2 text-[12.5px] text-[var(--color-fg-2)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 rounded px-3 py-2 whitespace-pre-wrap">
                    <span className="font-medium text-[var(--color-accent)]">Note : </span>
                    {d.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Suivi</CardTitle>
          </CardHeader>
          <div className="px-5 py-4">
            <ol className="relative space-y-3 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-[var(--color-border)]">
              {(() => {
                type Evt = {
                  key: string;
                  date: Date;
                  label: string;
                  dot: string;
                  // « Visite planifiée » : pas d'horodatage (se confond avec la date
                  // de visite, affichée à part sur « Visite douane à venir »).
                  hideDate?: boolean;
                };
                const events: Evt[] = [];
                for (const sc of dossier.statusChanges) {
                  events.push({
                    key: `sc-${sc.id}`,
                    date: sc.createdAt,
                    label: STATUS_LABELS[sc.toStatus],
                    dot: "bg-[var(--color-fg)]",
                    hideDate: sc.toStatus === "VISITE",
                  });
                }
                const todayMs = new Date().setHours(0, 0, 0, 0);
                const isDone = (d: Date) => new Date(d).getTime() <= todayMs + 86_400_000 - 1;
                if (dossier.visitDate) {
                  const done = isDone(dossier.visitDate);
                  events.push({
                    key: "visit-douane",
                    date: dossier.visitDate,
                    label: done ? "Visite douane effectuée" : "Visite douane à venir",
                    dot: done ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]",
                  });
                }
                if (dossier.conformityVisitDate) {
                  const done = isDone(dossier.conformityVisitDate);
                  events.push({
                    key: "visit-mci",
                    date: dossier.conformityVisitDate,
                    label: done
                      ? "Visite des organismes de contrôle effectuée"
                      : "Visite des organismes de contrôle à venir",
                    dot: done ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]",
                  });
                }
                if (dossier.deliveredAt) {
                  events.push({
                    key: "delivered",
                    date: dossier.deliveredAt,
                    label: "Livraison",
                    dot: "bg-[var(--color-success)]",
                  });
                }
                events.sort((a, b) => b.date.getTime() - a.date.getTime());
                return events.map((e) => (
                  <li key={e.key} className="relative pl-5">
                    <span
                      className={`absolute left-0 top-1.5 size-2.5 rounded-full ring-4 ring-[var(--color-surface)] ${e.dot}`}
                    />
                    <div className="text-[13px] font-medium">{e.label}</div>
                    {!e.hideDate && (
                      <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                        {formatDate(e.date)}
                      </div>
                    )}
                  </li>
                ));
              })()}
            </ol>
          </div>
        </Card>
      </div>

      {dossier.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <div className="divide-y divide-[var(--color-border)]">
            {dossier.comments.map((c) => (
              <div key={c.id} className="px-5 py-3">
                <div className="text-[13px] text-[var(--color-fg)]">{c.body}</div>
                <div className="text-[11.5px] text-[var(--color-fg-3)] mt-1">
                  {c.author.name} · {formatDate(c.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
