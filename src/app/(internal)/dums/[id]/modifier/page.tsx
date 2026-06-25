import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canCreateDUM } from "@/lib/roles";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DumEditForm } from "./dum-edit-form";

export const dynamic = "force-dynamic";

export default async function DUMEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;
  // Mêmes droits que l'édition inline du dossier.
  if (!canCreateDUM(session.user.role)) redirect(`/dums/${id}`);

  const dum = await prisma.dUM.findUnique({
    where: { id },
    include: { dossier: { select: { number: true } } },
  });
  if (!dum) notFound();

  const canEditNumber = ["ADMIN", "EXPLOITATION"].includes(session.user.role);
  // Forme sérialisable pour le formulaire client (Decimals → number).
  const editableDum = {
    id: dum.id,
    number: dum.number,
    status: dum.status,
    bureau: dum.bureau,
    regime: dum.regime,
    registeredAt: dum.registeredAt,
    liquidatedAt: dum.liquidatedAt,
    customsValue: dum.customsValue == null ? null : Number(dum.customsValue),
    estimatedDuties: dum.estimatedDuties == null ? null : Number(dum.estimatedDuties),
    liquidatedDuties: dum.liquidatedDuties == null ? null : Number(dum.liquidatedDuties),
    receiptNumber: dum.receiptNumber,
    paidAt: dum.paidAt,
    articleCount: dum.articleCount,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <BackLink href={`/dums/${id}`}>Retour à la DUM</BackLink>
      <PageHeader
        title={<span className="font-mono">{dum.number}</span>}
        subtitle={`Modifier la DUM — dossier ${dum.dossier.number}`}
      />
      <Card className="overflow-hidden">
        <DumEditForm dum={editableDum} dossierId={dum.dossierId} canEditNumber={canEditNumber} />
      </Card>
    </div>
  );
}
