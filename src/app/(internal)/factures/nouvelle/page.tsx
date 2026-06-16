import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { NewInvoiceForm } from "./form";
import { nextInvoiceNumber } from "@/lib/invoicing-server";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session) return null;

  const [clients, dossiers, next] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, city: true, ice: true, separateDebours: true },
    }),
    prisma.dossier.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, number: true, reference: true },
    }),
    nextInvoiceNumber(),
  ]);

  return (
    <div className="max-w-4xl space-y-5">
      <BackLink href="/factures">Retour aux factures</BackLink>

      <PageHeader
        title="Nouvelle facture"
        subtitle={
          <>
            Numéro proposé :{" "}
            <span className="font-mono font-medium text-[var(--color-fg)]">{next.number}</span>
          </>
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
            dossiers={dossiers}
            suggestedNumber={next.number}
          />
        </div>
      </Card>
    </div>
  );
}
