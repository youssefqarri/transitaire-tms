import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModifyDossier } from "@/lib/roles";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { NewDossierForm } from "../../nouveau/form";

export const dynamic = "force-dynamic";

export default async function EditDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canModifyDossier(session.user.role)) redirect("/dossiers");

  const [dossier, clients, suppliers] = await Promise.all([
    prisma.dossier.findUnique({ where: { id } }),
    prisma.client.findMany({ where: { deletedAt: null, active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!dossier) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <BackLink href={`/dossiers/${id}`}>Retour au dossier</BackLink>
      <PageHeader
        title="Modifier le dossier"
        subtitle={<span className="font-mono">{dossier.number}</span>}
      />
      <Card>
        <div className="p-5">
          <NewDossierForm
            mode="edit"
            dossierId={id}
            clients={clients}
            suppliers={suppliers}
            initial={{
              number: dossier.number,
              reference: dossier.reference ?? "",
              type: dossier.type,
              paymentMode: dossier.paymentMode,
              transport: dossier.transport ?? "",
              clientId: dossier.clientId,
              supplierId: dossier.supplierId ?? "",
              goodsValue: dossier.goodsValue ? String(dossier.goodsValue) : "",
              goodsCurrency: dossier.goodsCurrency ?? "EUR",
              goodsWeight: dossier.goodsWeight ? String(dossier.goodsWeight) : "",
              goodsPackages: dossier.goodsPackages != null ? String(dossier.goodsPackages) : "",
              goodsPackagingUnit: dossier.goodsPackagingUnit,
              goodsDescription: dossier.goodsDescription ?? "",
              controlOffice: dossier.controlOffice ?? "",
              controlOrganism: dossier.controlOrganism ?? "",
              regulatoryServices: dossier.regulatoryServices ?? [],
              visitDate: dossier.visitDate
                ? new Date(dossier.visitDate).toISOString().slice(0, 10)
                : "",
              visitEffectiveDate: dossier.visitEffectiveDate
                ? new Date(dossier.visitEffectiveDate).toISOString().slice(0, 10)
                : "",
              conformityVisitDate: dossier.conformityVisitDate
                ? new Date(dossier.conformityVisitDate).toISOString().slice(0, 10)
                : "",
              conformityVisitEffectiveDate: dossier.conformityVisitEffectiveDate
                ? new Date(dossier.conformityVisitEffectiveDate).toISOString().slice(0, 10)
                : "",
              deliveredAt: dossier.deliveredAt
                ? new Date(dossier.deliveredAt).toISOString().slice(0, 10)
                : "",
              billed: dossier.billed,
              delivered: dossier.delivered,
              baeUnderPayment: dossier.baeUnderPayment,
              baeUnderConformity: dossier.baeUnderConformity,
              awaitingConformityValidation: dossier.awaitingConformityValidation,
              customNote: dossier.customNote ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
