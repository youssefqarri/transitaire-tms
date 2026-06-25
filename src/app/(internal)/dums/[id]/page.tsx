import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canCreateDUM } from "@/lib/roles";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DumStatusBadge } from "@/components/dossier/dum-status-badge";
import { DUM_STATUS_LABELS, DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
import { formatDate } from "@/lib/utils";
import { formatMAD } from "@/lib/invoicing";
import { regimeDisplay } from "@/lib/reference";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const money = (n: unknown) => (n == null ? "—" : formatMAD(Number(n)));

export default async function DUMDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const dum = await prisma.dUM.findUnique({
    where: { id },
    include: {
      dossier: { include: { client: true } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!dum) notFound();

  const canEdit = canCreateDUM(session.user.role);

  return (
    <div className="space-y-5 animate-fade-in">
      <BackLink href="/dums">Retour aux DUMs</BackLink>

      <PageHeader
        title={<span className="font-mono">{dum.number}</span>}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <DumStatusBadge status={dum.status} />
            {dum.regime && (
              <Badge tone="neutral" title={regimeDisplay(dum.regime)}>Régime {dum.regime}</Badge>
            )}
          </span>
        }
        actions={
          canEdit ? (
            <Link
              href={`/dums/${dum.id}/modifier`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil /> Modifier
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Déclaration */}
        <Card>
          <CardHeader>
            <CardTitle>Déclaration</CardTitle>
          </CardHeader>
          <dl className="px-5 py-4 grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="N° DUM" value={dum.number} mono />
            <Field label="Régime douanier" value={regimeDisplay(dum.regime)} />
            <Field label="Bureau de douane" value={dum.bureau ?? "—"} />
            <Field label="Statut" value={DUM_STATUS_LABELS[dum.status]} />
            <div className="col-span-2 min-w-0">
              <dt className="text-[12px] text-[var(--color-fg-3)]">Dossier</dt>
              <dd className="mt-0.5 text-[13px]">
                <Link
                  href={`/dossiers/${dum.dossierId}`}
                  className="font-mono text-[var(--color-fg)] hover:underline"
                >
                  {dum.dossier.number}
                </Link>
                <span className="text-[var(--color-fg-3)]"> — {dum.dossier.client.name}</span>
              </dd>
            </div>
          </dl>
        </Card>

        {/* Valeur en douane & droits */}
        <Card>
          <CardHeader>
            <CardTitle>Valeur en douane et droits</CardTitle>
          </CardHeader>
          <dl className="px-5 py-4 grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Valeur en douane" value={money(dum.customsValue)} mono />
            <Field
              label="Nombre d'articles"
              value={dum.articleCount != null ? String(dum.articleCount) : "—"}
              mono
            />
            <Field label="Droits estimés" value={money(dum.estimatedDuties)} mono />
            <Field
              label="Droits liquidés"
              value={money(dum.liquidatedDuties)}
              mono
              strong
            />
            <Field label="N° de quittance" value={dum.receiptNumber || "—"} mono />
            <Field label="Payé le" value={dum.paidAt ? formatDate(dum.paidAt) : "—"} mono />
          </dl>
        </Card>
      </div>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <dl className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-4">
          <Field
            label="Enregistrement BADR"
            value={dum.registeredAt ? formatDate(dum.registeredAt) : "—"}
            mono
          />
          <Field
            label="Liquidation"
            value={dum.liquidatedAt ? formatDate(dum.liquidatedAt) : "—"}
            mono
          />
          <Field label="Paiement" value={dum.paidAt ? formatDate(dum.paidAt) : "—"} mono />
          <Field label="Créée le" value={formatDate(dum.createdAt)} mono />
        </dl>
      </Card>

      {/* Documents rattachés */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <span className="text-[12px] text-[var(--color-fg-3)] tnum">{dum.documents.length}</span>
        </CardHeader>
        {dum.documents.length === 0 ? (
          <div className="px-5 py-6 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucun document rattaché à cette DUM.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {dum.documents.map((doc) => (
              <li key={doc.id} className="px-5 py-2.5 flex items-center gap-3">
                <FileText
                  className="size-4 text-[var(--color-fg-mute)] shrink-0"
                  strokeWidth={1.75}
                />
                <span className="flex-1 min-w-0 truncate text-[13px] text-[var(--color-fg)]">
                  {doc.name}
                </span>
                <Badge tone="outline">{DOCUMENT_CATEGORY_LABELS[doc.category]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Notes */}
      {dum.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <p className="px-5 py-4 text-[13px] text-[var(--color-fg-2)] whitespace-pre-line">
            {dum.notes}
          </p>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  strong,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-[var(--color-fg-3)]">{label}</dt>
      <dd
        className={`mt-0.5 text-[13px] ${mono ? "font-mono tnum" : ""} ${
          strong ? "text-[var(--color-fg)] font-medium" : "text-[var(--color-fg-2)]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
