import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { MarkAllRead } from "./mark-all-read";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  DOCUMENT_MANQUANT: "Document manquant",
  DOSSIER_BLOQUE: "Dossier bloqué",
  ACTION_URGENTE_DOUANE: "Action douane urgente",
  DEMANDE_INSPECTEUR: "Demande inspecteur",
  DEMANDE_MCI: "Demande MCI",
  SUIVI_LIQUIDATION: "Suivi liquidation",
  STATUS_CHANGE: "Changement de statut",
  EMAIL_NEW: "Nouveau email",
  CLIENT_INFO: "Info client",
  CLIENT_DOC_UPLOAD: "Document reçu du client",
  CLIENT_NEW_DOSSIER: "Nouveau dossier client",
  AUTRE: "Autre",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) return null;

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ userId: session.user.id }, { role: session.user.role }],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { dossier: { select: { number: true } } },
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} non lue${unread > 1 ? "s" : ""}`}
        actions={<MarkAllRead />}
      />
      <Card>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                className={`flex items-start gap-3 p-4 hover:bg-[var(--color-surface-2)]/50 ${
                  !n.read ? "bg-[var(--color-accent)]/5" : ""
                }`}
              >
                <div className={`size-2 rounded-full mt-2 shrink-0 ${!n.read ? "bg-[var(--color-accent)]" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[13px]">{n.title}</span>
                    <Badge tone="outline">{KIND_LABELS[n.kind] ?? n.kind}</Badge>
                    {n.dossier && (
                      <span className="text-[11.5px] text-[var(--color-fg-3)]">
                        Dossier {n.dossier.number}
                      </span>
                    )}
                  </div>
                  {n.body && (
                    <div className="text-[13px] text-[var(--color-fg-3)] mt-1">
                      {n.body}
                    </div>
                  )}
                </div>
                <div className="text-[11.5px] text-[var(--color-fg-3)] whitespace-nowrap">
                  {formatDateTime(n.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
