import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
import { RestoreButton } from "./restore-button";

export const dynamic = "force-dynamic";

type Row = { id: string; label: string; sub: string; type: string };

export default async function CorbeillePage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const del = { deletedAt: { not: null } } as const;
  const [dossiers, clients, documents, contacts] = await Promise.all([
    prisma.dossier.findMany({ where: del, orderBy: { deletedAt: "desc" }, take: 100, select: { id: true, number: true, deletedAt: true } }),
    prisma.client.findMany({ where: del, orderBy: { deletedAt: "desc" }, take: 100, select: { id: true, name: true, deletedAt: true } }),
    prisma.document.findMany({ where: del, orderBy: { deletedAt: "desc" }, take: 100, select: { id: true, name: true, category: true, deletedAt: true } }),
    prisma.clientContact.findMany({ where: del, orderBy: { deletedAt: "desc" }, take: 100, select: { id: true, name: true, email: true, deletedAt: true } }),
  ]);

  const sections: { title: string; rows: Row[] }[] = [
    { title: "Dossiers", rows: dossiers.map((d) => ({ id: d.id, label: d.number, sub: formatDateTime(d.deletedAt), type: "dossier" })) },
    { title: "Clients", rows: clients.map((c) => ({ id: c.id, label: c.name, sub: formatDateTime(c.deletedAt), type: "client" })) },
    { title: "Documents", rows: documents.map((d) => ({ id: d.id, label: d.name, sub: `${DOCUMENT_CATEGORY_LABELS[d.category]} · ${formatDateTime(d.deletedAt)}`, type: "document" })) },
    { title: "Contacts", rows: contacts.map((c) => ({ id: c.id, label: c.name || c.email, sub: formatDateTime(c.deletedAt), type: "contact" })) },
  ];
  const total = sections.reduce((n, s) => n + s.rows.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Corbeille" subtitle="Éléments supprimés — restaurables" />
      {total === 0 ? (
        <Card>
          <EmptyState icon={Trash2} title="Corbeille vide" />
        </Card>
      ) : (
        <div className="space-y-5">
          {sections
            .filter((s) => s.rows.length > 0)
            .map((s) => (
              <Card key={s.title}>
                <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold tracking-tight">{s.title}</h3>
                  <span className="text-[11.5px] text-[var(--color-fg-3)] tnum">{s.rows.length}</span>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {s.rows.map((it) => (
                    <div key={it.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{it.label}</div>
                        <div className="text-[11.5px] text-[var(--color-fg-3)]">Supprimé le {it.sub}</div>
                      </div>
                      <RestoreButton type={it.type} id={it.id} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
