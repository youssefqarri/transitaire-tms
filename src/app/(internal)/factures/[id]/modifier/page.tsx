import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageInvoices } from "@/lib/roles";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { NewInvoiceForm } from "../../nouvelle/form";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageInvoices(session.user.role)) redirect("/dashboard");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!invoice) notFound();

  // Facture finalisée (non brouillon) → seul un administrateur peut la modifier.
  if (invoice.status !== "DRAFT" && session.user.role !== "ADMIN") {
    redirect(`/factures/${id}`);
  }

  const [clients, dossiers] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, city: true, separateDebours: true },
    }),
    prisma.dossier.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true,
        number: true,
        reference: true,
        clientId: true,
        transport: true,
        // Toutes les DUM du dossier : la plus récente (dums[0]) alimente les
        // champs du tarif syndical ; l'ensemble des `bureau` sert à décider de
        // l'affichage du bouton « Taxe régionale » (bureaux 309/411).
        dums: {
          orderBy: { createdAt: "desc" },
          select: {
            bureau: true,
            customsValue: true,
            articleCount: true,
            estimatedDuties: true,
            liquidatedDuties: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <BackLink href={`/factures/${id}`}>Retour à la facture</BackLink>

      <PageHeader
        title={`Modifier la facture ${invoice.number}`}
        subtitle={
          invoice.status === "DRAFT"
            ? "Brouillon — correction libre (Comptabilité / Admin)"
            : "Facture finalisée — modification réservée à l'administrateur"
        }
      />

      <Card>
        <div className="p-5">
          <NewInvoiceForm
            clients={clients.map((c) => ({
              id: c.id,
              name: c.name,
              code: c.code,
              city: c.city,
              separateDebours: c.separateDebours,
            }))}
            dossiers={dossiers.map((d) => ({
              id: d.id,
              number: d.number,
              reference: d.reference,
              clientId: d.clientId,
              transport: d.transport,
              customsValue: d.dums[0]?.customsValue != null ? Number(d.dums[0].customsValue) : null,
              customsDuties:
                d.dums[0]?.liquidatedDuties != null
                  ? Number(d.dums[0].liquidatedDuties)
                  : d.dums[0]?.estimatedDuties != null
                  ? Number(d.dums[0].estimatedDuties)
                  : null,
              articleCount: d.dums[0]?.articleCount ?? null,
              bureaux: d.dums.map((du) => du.bureau).filter((b): b is string => !!b),
            }))}
            suggestedNumber={invoice.number}
            edit={{
              id: invoice.id,
              number: invoice.number,
              clientId: invoice.clientId,
              dossierId: invoice.dossierId ?? "",
              issuedAt: invoice.issuedAt ? invoice.issuedAt.toISOString().slice(0, 10) : "",
              dueAt: invoice.dueAt ? invoice.dueAt.toISOString().slice(0, 10) : "",
              termsOfPayment: invoice.termsOfPayment ?? "",
              notes: invoice.notes ?? "",
              items: invoice.items.map((it) => ({
                kind: it.kind,
                code: it.code ?? "",
                description: it.description,
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice),
                vatRate: Number(it.vatRate),
              })),
            }}
          />
        </div>
      </Card>
    </div>
  );
}
