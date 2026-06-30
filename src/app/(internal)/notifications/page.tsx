import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { orgScope } from "@/lib/tenant";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { parsePagination } from "@/lib/pagination";
import { MarkAllRead } from "./mark-all-read";
import { NotifRow } from "./notif-row";

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

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; unread?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;

  const { page, size, skip } = parsePagination(params, { page: 1, size: 25, maxSize: 200 });
  const onlyUnread = params.unread === "1";
  const baseWhere = {
    ...orgScope(session.user.orgId),
    OR: [{ userId: session.user.id }, { role: session.user.role }],
  };
  const unreadCond = { read: false, receipts: { none: { userId: session.user.id } } };
  // Liste filtrée si « Non lues », sinon toutes ; le compteur « X non lue(s) »
  // reste le total non-lu réel (indépendant du filtre).
  const listWhere = onlyUnread ? { ...baseWhere, ...unreadCond } : baseWhere;

  const [total, notifications, unread] = await Promise.all([
    prisma.notification.count({ where: listWhere }),
    prisma.notification.findMany({
      where: listWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      include: {
        dossier: { select: { number: true } },
        receipts: { where: { userId: session.user.id }, select: { id: true } },
      },
    }),
    prisma.notification.count({
      where: { ...baseWhere, ...unreadCond },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} non lue${unread > 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden text-[12px] font-medium">
              <Link
                href="/notifications"
                className={`px-3 py-1.5 ${!onlyUnread ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-fg-3)] hover:bg-[var(--color-surface-2)]"}`}
              >
                Toutes
              </Link>
              <Link
                href="/notifications?unread=1"
                className={`px-3 py-1.5 border-l border-[var(--color-border)] ${onlyUnread ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-fg-3)] hover:bg-[var(--color-surface-2)]"}`}
              >
                Non lues
              </Link>
            </div>
            <MarkAllRead />
          </div>
        }
      />
      <Card>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {notifications.map((n) => (
              <NotifRow
                key={n.id}
                id={n.id}
                title={n.title}
                body={n.body}
                kindLabel={KIND_LABELS[n.kind] ?? n.kind}
                dossierNumber={n.dossier?.number ?? null}
                link={n.link ?? "#"}
                read={n.read || n.receipts.length > 0}
                createdAt={n.createdAt}
              />
            ))}
          </div>
        )}
        <Pagination
          page={page}
          pageSize={size}
          total={total}
          basePath="/notifications"
          extraParams={{ unread: onlyUnread ? "1" : undefined }}
        />
      </Card>
    </div>
  );
}
