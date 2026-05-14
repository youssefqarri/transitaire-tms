import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dossiers: true } } },
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fournisseurs</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/fournisseurs/nouveau">
          <Button>
            <Plus className="size-4" /> Nouveau fournisseur
          </Button>
        </Link>
      </div>
      <Card>
        {suppliers.length === 0 ? (
          <div className="p-16 text-center">
            <Truck className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucun fournisseur</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {suppliers.map((s) => (
              <Link
                key={s.id}
                href={`/fournisseurs/${s.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="size-10 rounded-lg bg-[var(--color-muted)] flex items-center justify-center">
                  <Truck className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {s.country ?? ""}{s.country && s.email && " · "}{s.email ?? ""}
                  </div>
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  {s._count.dossiers} dossier{s._count.dossiers > 1 ? "s" : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
