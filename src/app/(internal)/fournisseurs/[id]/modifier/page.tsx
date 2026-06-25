import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isInternal } from "@/lib/roles";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SupplierForm } from "../../nouveau/form";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role)) redirect("/fournisseurs");

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div className="space-y-5">
      <BackLink href={`/fournisseurs/${id}`}>Retour au fournisseur</BackLink>
      <PageHeader title="Modifier le fournisseur" subtitle={supplier.name} />
      <Card>
        <div className="p-5">
          <SupplierForm
            mode="edit"
            supplierId={id}
            initial={{
              name: supplier.name,
              country: supplier.country ?? "",
              email: supplier.email ?? "",
              phone: supplier.phone ?? "",
              address: supplier.address ?? "",
              notes: supplier.notes ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
