import { notFound } from "next/navigation";
import Link from "next/link";
import { Folder, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DeleteClientButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      dossiers: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { dums: true },
      },
      users: { select: { id: true, name: true, email: true } },
    },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <BackLink href="/clients">Retour aux clients</BackLink>

      <PageHeader
        title={client.name}
        subtitle={
          <>
            {client.code && `Code ${client.code} · `}
            {client.ice && `ICE ${client.ice} · `}
            {client.city}
          </>
        }
        actions={
          <>
            <Link href={`/clients/${id}/modifier`}>
              <Button variant="outline" size="sm">
                <Pencil /> Modifier
              </Button>
            </Link>
            <DeleteClientButton
              clientId={id}
              clientName={client.name}
              hasDossiers={client.dossiers.length > 0}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-[var(--color-border)] font-semibold">
            Dossiers ({client.dossiers.length})
          </div>
          {client.dossiers.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[var(--color-fg-3)]">
              Aucun dossier.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {client.dossiers.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-[var(--color-surface-2)]"
                >
                  <Folder className="size-4 text-[var(--color-fg-3)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{d.number}</div>
                    <div className="text-[11.5px] text-[var(--color-fg-3)]">
                      {d.reference} · {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-3)] hidden sm:block">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </div>
                  <StatusBadge status={d.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="p-5 border-b border-[var(--color-border)] font-semibold">Coordonnées</div>
          <div className="p-5 text-[13px] space-y-2">
            {client.email && (
              <div>
                <span className="text-[var(--color-fg-3)]">Email: </span>
                {client.email}
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-[var(--color-fg-3)]">Tél: </span>
                {client.phone}
              </div>
            )}
            {client.address && (
              <div>
                <span className="text-[var(--color-fg-3)]">Adresse: </span>
                {client.address}
              </div>
            )}
            {client.contactName && (
              <div>
                <span className="text-[var(--color-fg-3)]">Contact: </span>
                {client.contactName}
              </div>
            )}
          </div>
          <div className="p-5 border-t border-[var(--color-border)]">
            <div className="text-[11.5px] uppercase tracking-wide text-[var(--color-fg-3)] mb-2">
              Accès portail ({client.users.length})
            </div>
            {client.users.map((u) => (
              <div key={u.id} className="text-[13px]">
                {u.name}{" "}
                <span className="text-[var(--color-fg-3)]">· {u.email}</span>
              </div>
            ))}
            {client.users.length === 0 && (
              <div className="text-[13px] text-[var(--color-fg-3)]">
                Aucun accès configuré.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
