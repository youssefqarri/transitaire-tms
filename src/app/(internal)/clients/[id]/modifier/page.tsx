import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "../../nouveau/form";
import { isInternal } from "@/lib/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role)) redirect("/clients");

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <BackLink href={`/clients/${id}`}>Retour au client</BackLink>
      <PageHeader title="Modifier le client" subtitle={client.name} />
      <Card>
        <div className="p-5">
          <ClientForm
            mode="edit"
            clientId={id}
            initial={{
              name: client.name,
              code: client.code ?? "",
              ice: client.ice ?? "",
              rc: client.rc ?? "",
              taxId: client.taxId ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              city: client.city ?? "",
              address: client.address ?? "",
              contactName: client.contactName ?? "",
              notes: client.notes ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
