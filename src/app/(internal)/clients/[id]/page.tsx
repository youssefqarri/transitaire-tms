import { notFound } from "next/navigation";
import Link from "next/link";
import { Folder, Pencil, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageInvoices } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DeleteClientButton } from "./delete-button";
import { ContactsPanel } from "./contacts-panel";
import { ClientTariffEditor } from "./tariff-editor";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      dossiers: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { dums: true },
      },
      users: { select: { id: true, name: true, email: true } },
      contacts: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      tariffs: { orderBy: { order: "asc" } },
    },
  });
  if (!client) notFound();

  const showTariffs = !!session && canManageInvoices(session.user.role);

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
          <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
            <h3 className="text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
              Dossiers
            </h3>
            <span className="text-[12px] text-[var(--color-fg-3)] tnum">
              {client.dossiers.length}
            </span>
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
                  className="row-link flex items-center gap-3 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Folder className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-mono font-medium text-[var(--color-fg)]">
                      {d.number}
                    </div>
                    <div className="text-[12px] text-[var(--color-fg-3)] truncate">
                      {d.reference && <span className="font-mono">{d.reference}</span>}
                      {d.reference && <span className="text-[var(--color-fg-mute)]"> · </span>}
                      {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <div className="text-[12px] font-mono tnum text-[var(--color-fg-3)] hidden sm:block">
                    {formatCurrency(
                      d.goodsValue ? Number(d.goodsValue) : null,
                      d.goodsCurrency ?? "EUR",
                    )}
                  </div>
                  <StatusBadge status={d.status} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="px-5 py-3.5 border-b border-[var(--color-border)]">
            <h3 className="text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
              Coordonnées
            </h3>
          </div>
          <dl className="px-5 py-4 text-[13px] space-y-2.5">
            {client.email && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-[var(--color-fg-3)]">Email</dt>
                <dd className="text-[var(--color-fg)] break-all">{client.email}</dd>
              </div>
            )}
            {client.phone && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-[var(--color-fg-3)]">Tél.</dt>
                <dd className="text-[var(--color-fg)] tnum">{client.phone}</dd>
              </div>
            )}
            {client.address && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-[var(--color-fg-3)]">Adresse</dt>
                <dd className="text-[var(--color-fg)]">{client.address}</dd>
              </div>
            )}
            {client.contactName && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-[var(--color-fg-3)]">Contact</dt>
                <dd className="text-[var(--color-fg)]">{client.contactName}</dd>
              </div>
            )}
            {!client.email && !client.phone && !client.address && !client.contactName && (
              <div className="text-[var(--color-fg-3)]">Aucune coordonnée renseignée.</div>
            )}
          </dl>
          <div className="px-5 py-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-fg-3)]">
                Accès portail
              </div>
              <span className="text-[12px] text-[var(--color-fg-3)] tnum">
                {client.users.length}
              </span>
            </div>
            {client.users.length === 0 ? (
              <div className="text-[13px] text-[var(--color-fg-3)]">
                Aucun accès configuré.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {client.users.map((u) => (
                  <li key={u.id} className="text-[13px] text-[var(--color-fg)]">
                    {u.name}{" "}
                    <span className="text-[var(--color-fg-3)]">· {u.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ContactsPanel clientId={id} contacts={client.contacts} />
        </Card>
      </div>

      {showTariffs && (
        <Card>
          <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center gap-2">
            <Receipt className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
            <h3 className="text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
              Fiche tarifaire
            </h3>
          </div>
          <ClientTariffEditor
            clientId={id}
            initial={client.tariffs.map((t) => ({
              kind: t.kind,
              code: t.code,
              description: t.description,
              unitPrice: Number(t.unitPrice),
              vatRate: Number(t.vatRate),
            }))}
          />
        </Card>
      )}
    </div>
  );
}
