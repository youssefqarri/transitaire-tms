import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { dossiers: true, users: true } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {clients.length} client{clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/clients/nouveau">
          <Button>
            <Plus className="size-4" /> Nouveau client
          </Button>
        </Link>
      </div>

      <Card>
        {clients.length === 0 ? (
          <div className="p-16 text-center">
            <Building2 className="size-10 mx-auto text-[var(--color-muted-foreground)] mb-3" />
            <div className="font-medium">Aucun client</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-muted)] transition-colors"
              >
                <div className="size-10 rounded-lg bg-gradient-to-br from-[oklch(85%_0.08_258)] to-[oklch(70%_0.12_280)] flex items-center justify-center text-white font-semibold text-sm">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {c.code ? `${c.code} · ` : ""}
                    {c.ice ? `ICE ${c.ice} · ` : ""}
                    {c.city ?? ""}
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--color-muted-foreground)]">
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
