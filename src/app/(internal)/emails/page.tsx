import Link from "next/link";
import { Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
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
      <PageHeader
        title="Emails"
        subtitle={
          <>
            {emails.length} message{emails.length > 1 ? "s" : ""}
            {account && ` · compte ${account.emailAddress}`}
          </>
        }
        actions={
          account ? (
            <SyncButton />
          ) : (
            <Link
              href="/parametres"
              className="text-[13px] text-[var(--color-accent)] hover:underline"
            >
              Connecter Gmail →
            </Link>
          )
        }
      />

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
          <EmptyState
            icon={Inbox}
            title="Aucun email"
            hint={
              account
                ? "Cliquez sur Synchroniser pour récupérer les derniers emails."
                : "Connectez un compte Gmail dans Paramètres."
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {emails.map((e) => (
              <div
                key={e.id}
                className={`p-4 hover:bg-[var(--color-surface-2)]/50 ${!e.isRead ? "bg-[var(--color-accent)]/[0.02]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`size-2 rounded-full mt-2 shrink-0 ${!e.isRead ? "bg-[var(--color-accent)]" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[13px]">
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
                    <div className="text-[13px] mt-1">{e.subject || "(sans objet)"}</div>
                    <div className="text-[11.5px] text-[var(--color-fg-mute)] mt-1 truncate">
                      {e.snippet}
                    </div>
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-mute)] whitespace-nowrap">
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
