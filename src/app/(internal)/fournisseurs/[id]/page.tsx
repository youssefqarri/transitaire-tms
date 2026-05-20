import { notFound } from "next/navigation";
import Link from "next/link";
import { Truck, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/components/dossier/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      dossiers: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { client: true },
      },
    },
  });
  if (!supplier) notFound();

  return (
    <div className="space-y-5">
      <BackLink href="/fournisseurs">Retour aux fournisseurs</BackLink>

      <PageHeader
        title={supplier.name}
        subtitle={
          <>
            {supplier.country ?? "—"}
            {supplier.email && ` · ${supplier.email}`}
          </>
        }
        actions={
          <Link href={`/fournisseurs/${id}/modifier`}>
            <Button variant="outline" size="sm">
              <Pencil /> Modifier
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader>
            <CardTitle>
              Dossiers
              <span className="ml-2 text-[11.5px] font-normal text-[var(--color-fg-3)] tnum">
                {supplier.dossiers.length}
              </span>
            </CardTitle>
          </CardHeader>
          {supplier.dossiers.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
              Aucun dossier pour ce fournisseur.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {supplier.dossiers.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-surface-2)]"
                >
                  <Truck className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[13px] font-medium text-[var(--color-fg)]">
                      {d.number}
                    </div>
                    <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                      {d.client.name} · {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right text-[12px] text-[var(--color-fg-3)]">
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
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <div className="px-5 py-4 text-[13px] space-y-2 text-[var(--color-fg-2)]">
            {supplier.country && (
              <div>
                <span className="text-[var(--color-fg-3)]">Pays : </span>
                {supplier.country}
              </div>
            )}
            {supplier.email && (
              <div>
                <span className="text-[var(--color-fg-3)]">Email : </span>
                {supplier.email}
              </div>
            )}
            {supplier.phone && (
              <div>
                <span className="text-[var(--color-fg-3)]">Tél : </span>
                {supplier.phone}
              </div>
            )}
            {supplier.address && (
              <div>
                <span className="text-[var(--color-fg-3)]">Adresse : </span>
                {supplier.address}
              </div>
            )}
            {supplier.notes && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <div className="text-[var(--color-fg-3)] text-[11.5px] mb-1">Notes</div>
                <div className="whitespace-pre-wrap">{supplier.notes}</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
