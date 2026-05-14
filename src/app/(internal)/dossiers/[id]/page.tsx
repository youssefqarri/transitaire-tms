import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Folder,
  Calendar,
  Building2,
  Truck,
  Package,
  Scale,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import {
  STATUS_LABELS,
  DUM_STATUS_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  requiredDocuments,
} from "@/lib/statuses";
import { ROLE_LABELS } from "@/lib/roles";
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
    <div className="space-y-6 animate-fade-in max-w-7xl">
      <div>
        <Link
          href="/dossiers"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-4" /> Retour aux dossiers
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                Dossier {dossier.number}
              </h1>
              <StatusBadge status={dossier.status} />
              <Badge tone={dossier.type === "IMPORT" ? "info" : "ok"}>{dossier.type}</Badge>
              {dossier.paymentMode === "WITH_PAYMENT" && (
                <Badge tone="outline">Avec paiement</Badge>
              )}
            </div>
            <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {dossier.reference ? `Réf. ${dossier.reference} · ` : ""}
              Créé le {formatDate(dossier.createdAt)}
              {dossier.createdBy && ` par ${dossier.createdBy.name}`}
            </div>
          </div>
          <StatusChanger dossierId={dossier.id} currentStatus={dossier.status} />
        </div>
      </div>

      {missing.length > 0 && (
        <Card className="border-[oklch(80%_0.18_75)] bg-[oklch(98%_0.06_75)]">
          <div className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-[oklch(55%_0.18_60)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm">
                {missing.length} document{missing.length > 1 ? "s" : ""} manquant
                {missing.length > 1 ? "s" : ""}
              </div>
              <div className="text-sm text-[var(--color-muted-foreground)] mt-1 flex flex-wrap gap-1.5">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card>
            <div className="p-5 border-b border-[var(--color-border)] font-semibold flex items-center gap-2">
              <Folder className="size-4" /> Informations du dossier
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <InfoRow icon={Building2} label="Client" value={dossier.client.name} />
              <InfoRow icon={Truck} label="Fournisseur" value={dossier.supplier?.name ?? "—"} />
              <InfoRow
                icon={Tag}
                label="Valeur"
                value={formatCurrency(
                  dossier.goodsValue ? Number(dossier.goodsValue) : null,
                  dossier.goodsCurrency ?? "EUR",
                )}
              />
              <InfoRow
                icon={Package}
                label="Colis"
                value={formatNumber(dossier.goodsPackages)}
              />
              <InfoRow
                icon={Scale}
                label="Poids"
                value={dossier.goodsWeight ? `${formatNumber(Number(dossier.goodsWeight))} kg` : "—"}
              />
              <InfoRow
                icon={Calendar}
                label="Date visite"
                value={formatDate(dossier.visitDate)}
              />
              <InfoRow icon={Tag} label="Bureau" value={dossier.controlOffice ?? "—"} />
              <InfoRow
                icon={Tag}
                label="Assigné à"
                value={dossier.assignedTo?.name ?? "—"}
              />
              {dossier.goodsDescription && (
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">
                    Description marchandise
                  </div>
                  <div className="text-sm">{dossier.goodsDescription}</div>
                </div>
              )}
            </div>
          </Card>

          <DUMsPanel dossierId={dossier.id} dums={dossier.dums} canCreate={["ADMIN", "DECLARANT"].includes(session.user.role)} />

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

        <div className="space-y-6">
          <Card>
            <div className="p-5 border-b border-[var(--color-border)] font-semibold">Timeline</div>
            <div className="p-5">
              <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--color-border)]">
                {dossier.statusChanges.map((sc) => (
                  <li key={sc.id} className="relative pl-6">
                    <span className="absolute left-0 top-1 size-3.5 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-card)]" />
                    <div className="text-sm font-medium">{STATUS_LABELS[sc.toStatus]}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDateTime(sc.createdAt)}
                      {sc.changedBy && ` · ${sc.changedBy.name}`}
                    </div>
                    {sc.note && (
                      <div className="text-xs mt-1 text-[var(--color-muted-foreground)] italic">
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
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Folder;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="size-4 text-[var(--color-muted-foreground)] mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--color-muted-foreground)]">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
