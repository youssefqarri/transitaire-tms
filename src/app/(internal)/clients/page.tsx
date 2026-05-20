import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dossiers: true, users: true } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length > 1 ? "s" : ""}`}
        actions={
          <Link href="/clients/nouveau">
            <Button>
              <Plus className="size-4" /> Nouveau client
            </Button>
          </Link>
        }
      />

      <Card>
        {clients.length === 0 ? (
          <EmptyState icon={Building2} title="Aucun client" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="size-10 rounded-lg bg-gradient-to-br from-[oklch(85%_0.08_258)] to-[oklch(70%_0.12_280)] flex items-center justify-center text-white font-semibold text-[13px]">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px]">{c.name}</div>
                  <div className="text-[11.5px] text-[var(--color-fg-mute)]">
                    {c.code ? `${c.code} · ` : ""}
                    {c.ice ? `ICE ${c.ice} · ` : ""}
                    {c.city ?? ""}
                  </div>
                </div>
                <div className="text-right text-[11.5px] text-[var(--color-fg-mute)]">
                  <div>
                    {c._count.dossiers} dossier{c._count.dossiers > 1 ? "s" : ""}
                  </div>
                  <div>
                    {c._count.users} utilisateur{c._count.users > 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
