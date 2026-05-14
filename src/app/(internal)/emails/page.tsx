import Link from "next/link";
import { Mail, RefreshCw, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { canViewAccountingEmails, canViewCustomsEmails } from "@/lib/roles";
import { SyncButton } from "./sync-button";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  DOUANE: "Douane",
  PORTNET: "Portnet",
  MCI: "MCI",
  CLIENT: "Client",
  COMPAGNIE_MARITIME: "Cie maritime",
  INTERNE: "Interne",
  AUTRE: "Autre",
};

const SOURCE_TONES: Record<string, "info" | "warn" | "ok" | "outline" | "danger" | "neutral"> = {
  DOUANE: "danger",
  PORTNET: "info",
  MCI: "warn",
  CLIENT: "ok",
  COMPAGNIE_MARITIME: "info",
  INTERNE: "outline",
  AUTRE: "neutral",
};

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;

  // Comptabilité ne voit que ses emails (CLIENT / facture / quittance)
  const isCompta = session.user.role === "COMPTABILITE";
  const where = isCompta
    ? {
        OR: [
          { source: "CLIENT" as const },
          { subject: { contains: "facture", mode: "insensitive" as const } },
          { subject: { contains: "quittance", mode: "insensitive" as const } },
        ],
      }
    : params.source
      ? { source: params.source as never }
      : {};

  const emails = await prisma.emailMessage.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take: 100,
    include: { links: { include: { dossier: { select: { number: true, id: true } } } } },
  });

  const account = await prisma.emailAccount.findFirst({ where: { active: true } });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Emails</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {emails.length} message{emails.length > 1 ? "s" : ""}
            {account && ` · compte ${account.emailAddress}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {account ? (
            <SyncButton />
          ) : (
            <Link
              href="/parametres"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Connecter Gmail →
            </Link>
          )}
        </div>
      </div>

      {!isCompta && (
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/emails">
            <Badge tone={!params.source ? "info" : "outline"}>Tous</Badge>
          </Link>
          {Object.entries(SOURCE_LABELS).map(([k, l]) => (
            <Link key={k} href={`/emails?source=${k}`}>
              <Badge tone={params.source === k ? "info" : "outline"}>{l}</Badge>
            </Link>
          ))}
        </div>
      )}

      <Card>
        {emails.length === 0 ? (
          <div className="p-16 text-center">
            <Inbox className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucun email</div>
            <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {account
                ? "Cliquez sur Synchroniser pour récupérer les derniers emails."
                : "Connectez un compte Gmail dans Paramètres."}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {emails.map((e) => (
              <div
                key={e.id}
                className={`p-4 hover:bg-[var(--color-muted)]/50 ${!e.isRead ? "bg-[var(--color-primary)]/[0.02]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`size-2 rounded-full mt-2 shrink-0 ${!e.isRead ? "bg-[var(--color-primary)]" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {e.fromName ?? e.fromAddress}
                      </span>
                      <Badge tone={SOURCE_TONES[e.source] ?? "neutral"}>
                        {SOURCE_LABELS[e.source] ?? e.source}
                      </Badge>
                      {e.links.map((l) => (
                        <Link key={l.id} href={`/dossiers/${l.dossier.id}`}>
                          <Badge tone="info">→ {l.dossier.number}</Badge>
                        </Link>
                      ))}
                    </div>
                    <div className="text-sm mt-1">{e.subject || "(sans objet)"}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)] mt-1 truncate">
                      {e.snippet}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                    {formatDateTime(e.receivedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
