import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModifyDossier } from "@/lib/roles";
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
    prisma.client.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!dossier) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href={`/dossiers/${id}`}
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Retour au dossier
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Modifier le dossier</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5 font-mono">{dossier.number}</p>
      </div>
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
              clientId: dossier.clientId,
              supplierId: dossier.supplierId ?? "",
              goodsValue: dossier.goodsValue ? String(dossier.goodsValue) : "",
              goodsCurrency: dossier.goodsCurrency ?? "EUR",
              goodsWeight: dossier.goodsWeight ? String(dossier.goodsWeight) : "",
              goodsPackages: dossier.goodsPackages != null ? String(dossier.goodsPackages) : "",
              goodsPackagingUnit: dossier.goodsPackagingUnit,
              goodsDescription: dossier.goodsDescription ?? "",
              controlOffice: dossier.controlOffice ?? "",
              visitDate: dossier.visitDate
                ? new Date(dossier.visitDate).toISOString().slice(0, 10)
                : "",
              conformityVisitDate: dossier.conformityVisitDate
                ? new Date(dossier.conformityVisitDate).toISOString().slice(0, 10)
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
