import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import {
  STATUS_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  requiredDocuments,
} from "@/lib/statuses";

const PACKAGING_LABELS = {
  COLIS: "Colis",
  PALETTES: "Palettes",
  CONTENEURS: "Conteneurs",
  REMORQUES: "Remorques",
} as const;
import { StatusChanger } from "./status-changer";
import { DocumentsPanel } from "./documents-panel";
import { DUMsPanel } from "./dums-panel";
import { CommentsPanel } from "./comments-panel";
import { NotifyClientButton } from "./notify-button";
import { OutgoingMessagesPanel } from "./outgoing-messages-panel";
import { ExpectedDocumentsPanel } from "./expected-documents-panel";
import { DeleteDossierButton } from "./delete-button";
import { KeyDates } from "@/components/dossier/key-dates";

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
      documents: {
        orderBy: { receivedAt: "desc" },
        include: { uploadedBy: { select: { name: true, role: true } } },
      },
      expectedDocuments: {
        orderBy: { createdAt: "asc" },
        include: { requestedBy: { select: { name: true } } },
      },
      statusChanges: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      outgoingMessages: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { sentBy: { select: { name: true } } },
      },
    },
  });
  if (!dossier) notFound();

  const required = requiredDocuments(dossier.paymentMode);
  const presentCategories = new Set(dossier.documents.map((d) => d.category));
  const missing = required.filter((c) => !presentCategories.has(c));

  return (
    <div className="space-y-5 animate-fade-in">
      <BackLink href="/dossiers">Retour aux dossiers</BackLink>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-mono font-semibold tracking-tight text-[var(--color-fg)]">
              {dossier.number}
            </h1>
            <StatusBadge status={dossier.status} />
            <Badge tone={dossier.type === "IMPORT" ? "info" : "ok"}>{dossier.type}</Badge>
            {dossier.paymentMode === "WITH_PAYMENT" && (
              <Badge tone="outline">Avec paiement</Badge>
            )}
          </div>
          <p className="text-[13px] text-[var(--color-fg-3)]">
            {dossier.reference ? <>Réf. <span className="font-mono text-[var(--color-fg-2)]">{dossier.reference}</span> · </> : ""}
            Créé le {formatDate(dossier.createdAt)}
            {dossier.createdBy && ` par ${dossier.createdBy.name}`}
          </p>
        </div>
        {session.user.role !== "COMMIS_DOUANE" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Comptable : pas de notification (sauf envoi de facture, autre endpoint) */}
            {session.user.role !== "COMPTABILITE" && (
              <NotifyClientButton
                dossierId={dossier.id}
                clientEmail={dossier.client.email}
                clientPhone={dossier.client.phone}
              />
            )}
            {/* Comptable : pas de modif des champs du dossier */}
            {session.user.role !== "COMPTABILITE" && (
              <Link href={`/dossiers/${dossier.id}/modifier`}>
                <Button variant="outline" size="sm">
                  <Pencil /> Modifier
                </Button>
              </Link>
            )}
            {session.user.role === "ADMIN" && (
              <DeleteDossierButton dossierId={dossier.id} dossierNumber={dossier.number} />
            )}
            <StatusChanger
              dossierId={dossier.id}
              currentStatus={dossier.status}
              allowedStatuses={
                session.user.role === "COMPTABILITE" ? ["FACTURE", "CLOTURE"] : undefined
              }
            />
          </div>
        )}
      </header>

      {/* Dates clés (visite douane, MCI, livraison) avec icônes */}
      <KeyDates
        visitDate={dossier.visitDate}
        visitEffectiveDate={dossier.visitEffectiveDate}
        conformityVisitDate={dossier.conformityVisitDate}
        conformityVisitEffectiveDate={dossier.conformityVisitEffectiveDate}
        deliveredAt={dossier.deliveredAt}
        layout="row"
        size="md"
      />

      {/* Drapeaux parallèles (Facturé, BAE sous réserve, MCI en attente, etc.) */}
      {(dossier.billed ||
        (dossier.delivered && !dossier.deliveredAt) ||
        dossier.baeUnderPayment ||
        dossier.baeUnderConformity ||
        dossier.awaitingConformityValidation) && (
        <div className="flex flex-wrap gap-1.5">
          {dossier.billed && <Badge tone="ok">✓ Facturé</Badge>}
          {dossier.delivered && !dossier.deliveredAt && <Badge tone="ok">✓ Livré</Badge>}
          {dossier.baeUnderPayment && <Badge tone="warn">BAE sous réserve paiement</Badge>}
          {dossier.baeUnderConformity && <Badge tone="warn">BAE sous réserve conformité</Badge>}
          {dossier.awaitingConformityValidation && (
            <Badge tone="info">⏳ En attente conformité MCI</Badge>
          )}
        </div>
      )}

      {dossier.customNote && (
        <Card className="border-l-4 border-l-[var(--color-accent)] border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]">
          <div className="p-4 text-[13px] text-[var(--color-fg)] whitespace-pre-wrap">
            <span className="font-medium text-[var(--color-accent)]">Note : </span>
            {dossier.customNote}
          </div>
        </Card>
      )}

      {missing.length > 0 && (
        <Card className="border-l-4 border-l-[var(--color-warning)] border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)]">
          <div className="p-4 flex items-start gap-3">
            <AlertTriangle
              className="size-4 text-[var(--color-warning)] shrink-0 mt-0.5"
              strokeWidth={1.75}
            />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-[var(--color-fg)]">
                {missing.length} document{missing.length > 1 ? "s" : ""} manquant
                {missing.length > 1 ? "s" : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {missing.map((c) => (
                  <Badge tone="warn" key={c}>
                    {DOCUMENT_CATEGORY_LABELS[c]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-4 text-[13px]">
              <Field label="Client" value={
                <Link
                  href={`/clients/${dossier.clientId}`}
                  className="text-[var(--color-fg)] hover:text-[var(--color-accent)] hover:underline"
                >
                  {dossier.client.name}
                </Link>
              } />
              <Field label="Fournisseur" value={
                dossier.supplier ? (
                  <Link
                    href={`/fournisseurs/${dossier.supplier.id}`}
                    className="text-[var(--color-fg)] hover:text-[var(--color-accent)] hover:underline"
                  >
                    {dossier.supplier.name}
                  </Link>
                ) : (
                  <span className="text-[var(--color-fg-3)]">—</span>
                )
              } />
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
              <Field
                label={PACKAGING_LABELS[dossier.goodsPackagingUnit]}
                mono
                value={formatNumber(dossier.goodsPackages)}
              />
              <Field label="Bureau" value={dossier.controlOffice ?? "—"} />
              <Field label="Assigné" value={dossier.assignedTo?.name ?? "—"} />
              <Field label="Type" value={dossier.type} />
              {dossier.goodsDescription && (
                <div className="md:col-span-4 pt-1">
                  <div className="text-[11.5px] font-medium text-[var(--color-fg-3)] mb-1">
                    Description marchandise
                  </div>
                  <div className="text-[13px] text-[var(--color-fg)] whitespace-pre-wrap">
                    {dossier.goodsDescription}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {(() => {
            // COMMIS_DOUANE et COMPTABILITE = consultation seule sur les panels du dossier
            const readOnly =
              session.user.role === "COMMIS_DOUANE" || session.user.role === "COMPTABILITE";
            return (
              <>
                <DUMsPanel
                  dossierId={dossier.id}
                  dums={dossier.dums}
                  canCreate={["ADMIN", "DECLARANT"].includes(session.user.role)}
                />
                <DocumentsPanel
                  dossierId={dossier.id}
                  documents={dossier.documents.map((d) => ({
                    id: d.id,
                    name: d.name,
                    category: d.category,
                    version: d.version,
                    receivedAt: d.receivedAt,
                    fileUrl: d.fileUrl,
                    uploadedByName: d.uploadedBy?.name ?? null,
                    uploadedByIsClient: d.uploadedBy?.role === "CLIENT",
                    notes: d.notes,
                  }))}
                  requiredCategories={required}
                  readOnly={readOnly}
                />
                <ExpectedDocumentsPanel
                  dossierId={dossier.id}
                  expected={dossier.expectedDocuments.map((e) => ({
                    id: e.id,
                    category: e.category,
                    name: e.name,
                    note: e.note,
                    fulfilledAt: e.fulfilledAt,
                    requestedByName: e.requestedBy?.name ?? null,
                    createdAt: e.createdAt,
                  }))}
                  readOnly={readOnly}
                />
              </>
            );
          })()}
          {dossier.outgoingMessages.length > 0 && (
            <OutgoingMessagesPanel
              messages={dossier.outgoingMessages.map((m) => ({
                id: m.id,
                channel: m.channel,
                subject: m.subject,
                body: m.body,
                status: m.status,
                error: m.error,
                toAddress: m.toAddress,
                templateKey: m.templateKey,
                sentByName: m.sentBy?.name ?? null,
                createdAt: m.createdAt,
                sentAt: m.sentAt,
              }))}
            />
          )}
        </div>

        <div className="space-y-5">
          <Card className="self-start">
            <CardHeader>
              <CardTitle>Chronologie</CardTitle>
            </CardHeader>
            <div className="px-5 py-4 max-h-[640px] overflow-y-auto scrollbar-thin">
              <ol className="relative space-y-3.5 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-[var(--color-border)]">
              {(() => {
                type Evt = {
                  key: string;
                  date: Date;
                  label: string;
                  meta?: string;
                  note?: string;
                  dot: string;
                };
                const events: Evt[] = [];
                for (const sc of dossier.statusChanges) {
                  events.push({
                    key: `sc-${sc.id}`,
                    date: sc.createdAt,
                    label: STATUS_LABELS[sc.toStatus],
                    meta: sc.changedBy?.name,
                    note: sc.note ?? undefined,
                    dot: "bg-[var(--color-fg)]",
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
                    label: done ? "Visite MCI effectuée" : "Visite MCI à venir",
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
                    <div className="text-[13px] font-medium text-[var(--color-fg)]">
                      {e.label}
                    </div>
                    <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                      {formatDateTime(e.date)}
                      {e.meta && ` · ${e.meta}`}
                    </div>
                    {e.note && (
                      <div className="text-[12px] text-[var(--color-fg-3)] mt-1 italic">
                        {e.note}
                      </div>
                    )}
                  </li>
                ));
              })()}
              </ol>
            </div>
          </Card>

          {/* Commentaires sous la chronologie pour gagner de l'espace */}
          {session.user.role !== "COMMIS_DOUANE" && (
            <CommentsPanel
              dossierId={dossier.id}
              comments={dossier.comments.map((c) => ({
                id: c.id,
                body: c.body,
                internal: c.internal,
                createdAt: c.createdAt,
                authorName: c.author.name,
              }))}
              readOnly={session.user.role === "COMPTABILITE"}
            />
          )}
        </div>
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
      <div className="text-[11.5px] font-medium text-[var(--color-fg-3)] mb-1">{label}</div>
      <div
        className={
          mono
            ? "font-mono text-[13px] tnum text-[var(--color-fg)]"
            : "text-[13px] text-[var(--color-fg)]"
        }
      >
        {value}
      </div>
    </div>
  );
}
