import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
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
    <div className="space-y-5">
      <Link
        href="/dossiers"
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Retour aux dossiers
      </Link>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-semibold tracking-tight font-mono">
              {dossier.number}
            </h1>
            <StatusBadge status={dossier.status} />
            <Badge tone={dossier.type === "IMPORT" ? "info" : "ok"}>{dossier.type}</Badge>
            {dossier.paymentMode === "WITH_PAYMENT" && (
              <Badge tone="outline">Avec paiement</Badge>
            )}
          </div>
          <p className="text-[13px] text-[var(--color-fg-3)]">
            {dossier.reference ? <>Réf. <span className="font-mono">{dossier.reference}</span> · </> : ""}
            Créé le {formatDate(dossier.createdAt)}
            {dossier.createdBy && ` par ${dossier.createdBy.name}`}
          </p>
        </div>
        <StatusChanger dossierId={dossier.id} currentStatus={dossier.status} />
      </header>

      {missing.length > 0 && (
        <Card className="border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)]">
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
              <Field label="Client" value={dossier.client.name} />
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
                  <div className="text-[11.5px] font-medium text-[var(--color-fg-3)] mb-1">
                    Description marchandise
                  </div>
                  <div className="text-[13px] text-[var(--color-fg)]">
                    {dossier.goodsDescription}
                  </div>
                </div>
              )}
            </div>
          </Card>

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

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Chronologie</CardTitle>
          </CardHeader>
          <div className="px-5 py-4">
            <ol className="relative space-y-3.5 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-[var(--color-border)]">
              {dossier.statusChanges.map((sc) => (
                <li key={sc.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2.5 rounded-full bg-[var(--color-fg)] ring-4 ring-[var(--color-surface)]" />
                  <div className="text-[13px] font-medium text-[var(--color-fg)]">
                    {STATUS_LABELS[sc.toStatus]}
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                    {formatDateTime(sc.createdAt)}
                    {sc.changedBy && ` · ${sc.changedBy.name}`}
                  </div>
                  {sc.note && (
                    <div className="text-[12px] text-[var(--color-fg-3)] mt-1 italic">
                      {sc.note}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </Card>
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
