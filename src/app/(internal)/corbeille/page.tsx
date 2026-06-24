import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
import { CorbeilleClient, type TrashRow } from "./corbeille-client";

export const dynamic = "force-dynamic";

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

  const rows: (TrashRow & { ts: number })[] = [
    ...dossiers.map((d) => ({ id: d.id, type: "dossier", typeLabel: "Dossier", label: d.number, sub: formatDateTime(d.deletedAt), viewHref: `/dossiers/${d.id}`, ts: d.deletedAt!.getTime() })),
    ...clients.map((c) => ({ id: c.id, type: "client", typeLabel: "Client", label: c.name, sub: formatDateTime(c.deletedAt), viewHref: `/clients/${c.id}`, ts: c.deletedAt!.getTime() })),
    ...documents.map((d) => ({ id: d.id, type: "document", typeLabel: "Document", label: d.name, sub: `${DOCUMENT_CATEGORY_LABELS[d.category]} • ${formatDateTime(d.deletedAt)}`, viewHref: null, ts: d.deletedAt!.getTime() })),
    ...contacts.map((c) => ({ id: c.id, type: "contact", typeLabel: "Contact", label: c.name || c.email, sub: formatDateTime(c.deletedAt), viewHref: null, ts: c.deletedAt!.getTime() })),
  ].sort((a, b) => b.ts - a.ts);

  const typeOptions = [
    { value: "dossier", label: "Dossiers", n: dossiers.length },
    { value: "client", label: "Clients", n: clients.length },
    { value: "document", label: "Documents", n: documents.length },
    { value: "contact", label: "Contacts", n: contacts.length },
  ]
    .filter((o) => o.n > 0)
    .map(({ value, label }) => ({ value, label }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Corbeille" subtitle="Éléments supprimés — restaurables" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Trash2} title="Corbeille vide" />
        </Card>
      ) : (
        <CorbeilleClient rows={rows.map(({ ts: _ts, ...r }) => r)} typeOptions={typeOptions} />
      )}
    </div>
  );
}
