import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Folder, FileText, Receipt, Building2, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { searchAll } from "@/lib/search";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, LucideIcon> = {
  dossier: Folder,
  dum: FileText,
  facture: Receipt,
  client: Building2,
  fournisseur: Truck,
};

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role === "CLIENT") redirect("/dashboard");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const groups = q.length >= 2 ? await searchAll(q, 25, session.user.orgId) : [];
  const total = groups.reduce((n, g) => n + g.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recherche"
        subtitle={
          q
            ? `${total} résultat${total > 1 ? "s" : ""} pour « ${q} »`
            : "Saisissez un terme dans la barre de recherche, en haut."
        }
      />

      {q.length < 2 ? (
        <Card>
          <EmptyState
            icon={Search}
            title="Recherchez dossiers, DUM, factures, clients…"
            hint="Tapez au moins 2 caractères dans la barre de recherche."
          />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="Aucun résultat" hint={`Rien ne correspond à « ${q} ».`} />
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const Icon = TYPE_ICON[g.type] ?? Folder;
            return (
              <Card key={g.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-4 text-[var(--color-fg-3)]" strokeWidth={1.75} />
                    {g.label}
                  </CardTitle>
                  <span className="text-[12px] text-[var(--color-fg-3)] tnum">{g.total}</span>
                </CardHeader>
                <div className="divide-y divide-[var(--color-border)]">
                  {g.items.map((it) => (
                    <Link
                      key={it.id}
                      href={it.href}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <span className="font-mono text-[13px] font-medium text-[var(--color-fg)] shrink-0">
                        {it.title}
                      </span>
                      {it.sub && (
                        <span className="text-[12px] text-[var(--color-fg-3)] truncate">
                          {it.sub}
                        </span>
                      )}
                    </Link>
                  ))}
                  {g.total > g.items.length && (
                    <div className="px-5 py-2 text-[12px] text-[var(--color-fg-mute)]">
                      … et {g.total - g.items.length} autre{g.total - g.items.length > 1 ? "s" : ""}.
                      Affinez votre recherche pour réduire la liste.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
