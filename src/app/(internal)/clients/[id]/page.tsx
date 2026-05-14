import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";

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
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="size-4" /> Retour aux clients
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <div className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {client.code && `Code ${client.code} · `}
            {client.ice && `ICE ${client.ice} · `}
            {client.city}
          </div>
        </div>
        <Link href={`/clients/${id}/modifier`}>
          <Button variant="outline" size="sm">
            <Pencil /> Modifier
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-[var(--color-border)] font-semibold">
            Dossiers ({client.dossiers.length})
          </div>
          {client.dossiers.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Aucun dossier.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {client.dossiers.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-[var(--color-muted)]"
                >
                  <Folder className="size-4 text-[var(--color-muted-foreground)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{d.number}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {d.reference} · {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)] hidden sm:block">
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
          <div className="p-5 text-sm space-y-2">
            {client.email && (
              <div>
                <span className="text-[var(--color-muted-foreground)]">Email: </span>
                {client.email}
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-[var(--color-muted-foreground)]">Tél: </span>
                {client.phone}
              </div>
            )}
            {client.address && (
              <div>
                <span className="text-[var(--color-muted-foreground)]">Adresse: </span>
                {client.address}
              </div>
            )}
            {client.contactName && (
              <div>
                <span className="text-[var(--color-muted-foreground)]">Contact: </span>
                {client.contactName}
              </div>
            )}
          </div>
          <div className="p-5 border-t border-[var(--color-border)]">
            <div className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
              Accès portail ({client.users.length})
            </div>
            {client.users.map((u) => (
              <div key={u.id} className="text-sm">
                {u.name}{" "}
                <span className="text-[var(--color-muted-foreground)]">· {u.email}</span>
              </div>
            ))}
            {client.users.length === 0 && (
              <div className="text-sm text-[var(--color-muted-foreground)]">
                Aucun accès configuré.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
