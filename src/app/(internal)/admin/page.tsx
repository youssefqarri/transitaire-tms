import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { OrgActiveToggle } from "./org-toggle";

export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { users: true, dossiers: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cabinets"
        subtitle={`${orgs.length} organisation${orgs.length > 1 ? "s" : ""} sur la plateforme`}
        actions={
          <Link href="/admin/nouveau">
            <Button>
              <Plus className="size-4" /> Nouveau cabinet
            </Button>
          </Link>
        }
      />

      <Card>
        {orgs.length === 0 ? (
          <EmptyState icon={Building2} title="Aucun cabinet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)]">
                  <th className="px-5 py-2 text-left font-medium">Cabinet</th>
                  <th className="px-5 py-2 text-left font-medium">Slug</th>
                  <th className="px-5 py-2 text-right font-medium">Utilisateurs</th>
                  <th className="px-5 py-2 text-right font-medium">Dossiers</th>
                  <th className="px-5 py-2 text-left font-medium">Statut</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <td className="px-5 py-2.5 font-medium text-[var(--color-fg)]">{o.name}</td>
                    <td className="px-5 py-2.5 font-mono text-[var(--color-fg-3)]">{o.slug}</td>
                    <td className="px-5 py-2.5 text-right tnum">{o._count.users}</td>
                    <td className="px-5 py-2.5 text-right tnum">{o._count.dossiers}</td>
                    <td className="px-5 py-2.5">
                      {o.active ? (
                        <Badge tone="ok" dot>
                          Actif
                        </Badge>
                      ) : (
                        <Badge tone="danger" dot>
                          Suspendu
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <OrgActiveToggle orgId={o.id} active={o.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
