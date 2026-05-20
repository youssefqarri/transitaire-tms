import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dossiers: true } } },
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Fournisseurs"
        subtitle={`${suppliers.length} fournisseur${suppliers.length > 1 ? "s" : ""}`}
        actions={
          <Link href="/fournisseurs/nouveau">
            <Button>
              <Plus className="size-4" /> Nouveau fournisseur
            </Button>
          </Link>
        }
      />
      <Card>
        {suppliers.length === 0 ? (
          <EmptyState icon={Truck} title="Aucun fournisseur" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {suppliers.map((s) => (
              <Link
                key={s.id}
                href={`/fournisseurs/${s.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="size-10 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-3)]">
                  <Truck className="size-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px] text-[var(--color-fg)] truncate">
                    {s.name}
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-3)] truncate">
                    {s.country}
                    {s.country && s.email && (
                      <span className="text-[var(--color-fg-mute)]"> · </span>
                    )}
                    {s.email}
                  </div>
                </div>
                <div className="text-[11.5px] text-[var(--color-fg-3)] tnum text-right">
                  <span className="font-semibold text-[var(--color-fg-2)]">
                    {s._count.dossiers}
                  </span>{" "}
                  dossier{s._count.dossiers > 1 ? "s" : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
