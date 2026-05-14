import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Folder, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
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
      statusChanges: { orderBy: { createdAt: "desc" }, take: 10 },
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
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/portail"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-4" /> Mes dossiers
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                Dossier {dossier.number}
              </h1>
              <StatusBadge status={dossier.status} />
            </div>
            <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {dossier.reference ? `Réf. ${dossier.reference} · ` : ""}
              Créé le {formatDate(dossier.createdAt)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-muted-foreground)]">Valeur</div>
            <div className="text-lg font-semibold">
              {formatCurrency(
                dossier.goodsValue ? Number(dossier.goodsValue) : null,
                dossier.goodsCurrency ?? "EUR",
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)] mb-2">
            <span>Avancement</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[oklch(60%_0.18_280)] rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </Card>

      {missing.length > 0 && (
        <Card className="border-[oklch(80%_0.18_75)] bg-[oklch(98%_0.06_75)] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[oklch(55%_0.18_60)] shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-sm">
                Documents à fournir
              </div>
              <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Merci de transmettre les documents suivants à notre équipe :
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
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
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-[var(--color-border)] font-semibold flex items-center gap-2">
            <FileText className="size-4" /> Documents
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {dossier.documents.length === 0 && (
              <div className="p-6 text-sm text-[var(--color-muted-foreground)] text-center">
                Aucun document disponible.
              </div>
            )}
            {dossier.documents.map((d) => (
              <div key={d.id} className="p-4 flex items-center gap-3">
                <FileText className="size-4 text-[var(--color-muted-foreground)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {DOCUMENT_CATEGORY_LABELS[d.category]} · {formatDate(d.receivedAt)}
                  </div>
                </div>
                {d.fileUrl && (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Télécharger
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b border-[var(--color-border)] font-semibold">Suivi</div>
          <div className="p-5">
            <ol className="relative space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--color-border)]">
              {dossier.statusChanges.map((sc) => (
                <li key={sc.id} className="relative pl-6">
                  <span className="absolute left-0 top-1 size-3.5 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-card)]" />
                  <div className="text-sm font-medium">{STATUS_LABELS[sc.toStatus]}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {formatDate(sc.createdAt)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>

      {dossier.comments.length > 0 && (
        <Card>
          <div className="p-5 border-b border-[var(--color-border)] font-semibold">
            Messages
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {dossier.comments.map((c) => (
              <div key={c.id} className="p-4">
                <div className="text-sm">{c.body}</div>
                <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
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
