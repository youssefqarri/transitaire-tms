import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {notifications.filter((n) => !n.read).length} non lue{notifications.filter((n) => !n.read).length > 1 ? "s" : ""}
          </p>
        </div>
        <MarkAllRead />
      </div>
      <Card>
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucune notification</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                className={`flex items-start gap-3 p-4 hover:bg-[var(--color-muted)]/50 ${
                  !n.read ? "bg-[var(--color-primary)]/5" : ""
                }`}
              >
                <div className={`size-2 rounded-full mt-2 shrink-0 ${!n.read ? "bg-[var(--color-primary)]" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{n.title}</span>
                    <Badge tone="outline">{KIND_LABELS[n.kind] ?? n.kind}</Badge>
                    {n.dossier && (
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Dossier {n.dossier.number}
                      </span>
                    )}
                  </div>
                  {n.body && (
                    <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
                      {n.body}
                    </div>
                  )}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
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
