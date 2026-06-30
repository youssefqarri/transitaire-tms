import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { orgScope } from "@/lib/tenant";
import { canCreateDUM } from "@/lib/roles";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import {
  STATUS_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  requiredDocuments,
  statusesForType,
  statusTiming,
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
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { OutgoingMessagesPanel } from "./outgoing-messages-panel";
import { ExpectedDocumentsPanel } from "./expected-documents-panel";
import { DeleteDossierButton } from "./delete-button";
import { KeyDates } from "@/components/dossier/key-dates";

export const dynamic = "force-dynamic";

export default async function DossierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  // « Retour » dynamique : reflète d'où l'on vient (notifications vs liste dossiers).
  const back =
    from === "notifications"
      ? { href: "/notifications", label: "Retour aux notifications" }
      : { href: "/dossiers", label: "Retour aux dossiers" };
  const session = await auth();
  if (!session) return null;

  const dossier = await prisma.dossier.findFirst({
    where: { ...orgScope(session.user.orgId), id },
    include: {
      client: { include: { contacts: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } } },
      supplier: true,
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      dums: { orderBy: { createdAt: "desc" } },
      documents: {
        where: { deletedAt: null },
        orderBy: { receivedAt: "desc" },
        include: { uploadedBy: { select: { name: true, role: true } } },
      },
      expectedDocuments: {
        where: { deletedAt: null },
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

  const waConfigured = await isWhatsAppConfigured();
  const required = requiredDocuments(dossier.paymentMode, dossier.transport);
  const presentCategories = new Set(dossier.documents.map((d) => d.category));
  const missing = required.filter((c) => !presentCategories.has(c));

  return (
    <div className="space-y-5 animate-fade-in">
      <BackLink href={back.href}>{back.label}</BackLink>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-mono font-semibold tracking-tight text-[var(--color-fg)]">
              {dossier.number}
            </h1>
            <StatusBadge status={dossier.status} title={statusTiming(dossier) ?? undefined} />
            {dossier.secondaryStatus && (
              <span className="inline-flex items-center gap-1.5" title="Statut organismes de contrôle (en parallèle de la douane)">
                <span className="text-[11px] text-[var(--color-fg-3)]">Organismes&nbsp;:</span>
                <StatusBadge status={dossier.secondaryStatus} size="sm" />
              </span>
            )}
            <Badge tone={dossier.type === "IMPORT" ? "info" : "ok"}>
              {dossier.type === "IMPORT" ? "Import" : "Export"}
            </Badge>
            {dossier.paymentMode === "WITH_PAYMENT" && (
              <Badge tone="outline">Avec paiement</Badge>
            )}
          </div>
          <p className="text-[13px] text-[var(--color-fg-3)]">
            {dossier.reference ? <>Réf. <span className="font-mono text-[var(--color-fg-2)]">{dossier.reference}</span> • </> : ""}
            Créé le{" "}
            <span title={formatDateTime(dossier.createdAt)}>
              {formatDate(dossier.createdAt)}
            </span>
            {dossier.createdBy && ` par ${dossier.createdBy.name}`}
          </p>
        </div>
        {session.user.role !== "COMMIS_DOUANE" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Comptable : pas de notification (sauf envoi de facture, autre endpoint) */}
            {session.user.role !== "COMPTABILITE" && (
              <NotifyClientButton
                dossierId={dossier.id}
                clientId={dossier.clientId}
                clientEmail={dossier.client.email}
                clientPhone={dossier.client.whatsapp ?? dossier.client.phone}
                contacts={dossier.client.contacts}
                dossierContactEmail={dossier.contactEmail}
                waConfigured={waConfigured}
              />
            )}
            {/* Comptable : pas de modif des champs du dossier */}
            {session.user.role !== "COMPTABILITE" && (
              <Link href={`/dossiers/${dossier.id}/modifier`}>
                <Button variant="soft" size="sm">
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
              currentSecondaryStatus={dossier.secondaryStatus}
              allowedStatuses={
                session.user.role === "COMPTABILITE"
                  ? ["FACTURE", "CLOTURE"]
                  : statusesForType(dossier.type)
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
              <div className="text-[14px] font-medium text-[var(--color-fg)]">
                {missing.length} document{missing.length > 1 ? "s" : ""} manquant
                {missing.length > 1 ? "s" : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {missing.map((c) => (
                  <Badge tone="warn" size="lg" key={c}>
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
              <Field label="Organisme de contrôle" value={dossier.controlOrganism ?? "—"} />
              <Field
                label="Services réglementaires"
                value={dossier.regulatoryServices.length ? dossier.regulatoryServices.join(", ") : "—"}
              />
              <Field label="Assigné" value={dossier.assignedTo?.name ?? "—"} />
              <Field label="Type" value={dossier.type === "IMPORT" ? "Import" : "Export"} />
              {dossier.goodsDescription && (
                <div className="md:col-span-4 pt-1">
                  <div className="text-[12px] font-medium text-[var(--color-fg-3)] mb-1">
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
                  dums={dossier.dums.map((d) => ({
                    id: d.id,
                    number: d.number,
                    status: d.status,
                    bureau: d.bureau,
                    regime: d.regime,
                    registeredAt: d.registeredAt,
                    liquidatedAt: d.liquidatedAt,
                    customsValue: d.customsValue ? Number(d.customsValue) : null,
                    estimatedDuties: d.estimatedDuties ? Number(d.estimatedDuties) : null,
                    liquidatedDuties: d.liquidatedDuties ? Number(d.liquidatedDuties) : null,
                    receiptNumber: d.receiptNumber,
                    paidAt: d.paidAt,
                    articleCount: d.articleCount ?? null,
                  }))}
                  canCreate={canCreateDUM(session.user.role)}
                  canEditNumber={["ADMIN", "EXPLOITATION"].includes(session.user.role)}
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
                  clientId={dossier.clientId}
                  clientEmail={dossier.client.email}
                  clientPhone={dossier.client.whatsapp ?? dossier.client.phone}
                  contacts={dossier.client.contacts}
                  dossierContactEmail={dossier.contactEmail}
                  waConfigured={waConfigured}
                />
              </>
            );
          })()}
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
                  // Statut « Visite planifiée » : on n'affiche pas l'horodatage du
                  // changement, qui se confond avec la date de visite (saisie à part,
                  // parfois connue 24h plus tard). Le jour de visite reste sur sa
                  // propre ligne « Visite douane à venir ». Horodatage gardé en infobulle.
                  hideDate?: boolean;
                };
                const events: Evt[] = [];
                for (const sc of dossier.statusChanges) {
                  const isControl = sc.track === "CONTROLE";
                  // Statut inchangé + note = note libre ajoutée à la chronologie.
                  const isNote = sc.fromStatus === sc.toStatus;
                  events.push({
                    key: `sc-${sc.id}`,
                    date: sc.createdAt,
                    label: isNote
                      ? "Note" + (isControl ? " — organismes" : "")
                      : STATUS_LABELS[sc.toStatus] + (isControl ? " — organismes" : ""),
                    meta: sc.changedBy?.name,
                    note: sc.note ?? undefined,
                    dot: isNote
                      ? "bg-[var(--color-fg-mute)]"
                      : isControl
                        ? "bg-[var(--color-accent)]"
                        : "bg-[var(--color-fg)]",
                    hideDate: !isNote && !isControl && sc.toStatus === "VISITE",
                  });
                }
                const todayMs = new Date().setHours(0, 0, 0, 0);
                const isDone = (d: Date) => new Date(d).getTime() <= todayMs + 86_400_000 - 1;
                // Visite douane : date réelle (effective) si renseignée, sinon date prévue.
                if (dossier.visitEffectiveDate || dossier.visitDate) {
                  const eff = dossier.visitEffectiveDate;
                  const d = eff ?? dossier.visitDate!;
                  const done = eff ? true : isDone(d);
                  events.push({
                    key: "visit-douane",
                    date: d,
                    label: done ? "Visite douane effectuée" : "Visite douane à venir",
                    dot: done ? "bg-[var(--color-success)]" : "bg-[var(--color-accent)]",
                  });
                }
                // Visite organismes de contrôle : idem (date effective si renseignée).
                if (dossier.conformityVisitEffectiveDate || dossier.conformityVisitDate) {
                  const eff = dossier.conformityVisitEffectiveDate;
                  const d = eff ?? dossier.conformityVisitDate!;
                  const done = eff ? true : isDone(d);
                  events.push({
                    key: "visit-mci",
                    date: d,
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
                // Date d'enregistrement BADR de chaque DUM
                for (const dum of dossier.dums) {
                  if (dum.registeredAt) {
                    events.push({
                      key: `dum-${dum.id}`,
                      date: dum.registeredAt,
                      label: `DUM ${dum.number} enregistrée`,
                      dot: "bg-[var(--color-success)]",
                    });
                  }
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
                    <div
                      className="text-[12px] text-[var(--color-fg-3)] mt-0.5"
                      title={e.hideDate ? `Statut modifié le ${formatDateTime(e.date)}` : undefined}
                    >
                      {e.hideDate ? (
                        e.meta
                      ) : (
                        <>
                          {/* Évènements « jour » (visite, contrôle, livraison, DUM) :
                              date seule — pas d'heure réelle (stockés à minuit). Les
                              changements de statut (sc-…) gardent l'horodatage. */}
                          {(/^(visit-|delivered|dum-)/.test(e.key) ? formatDate : formatDateTime)(e.date)}
                          {e.meta && ` • ${e.meta}`}
                        </>
                      )}
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
      </div>
    </div>
  );
}
