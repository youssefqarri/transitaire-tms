import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDossier } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { NewDossierForm } from "./form";

export default async function NewDossierPage() {
  const session = await auth();
  if (!session || !canCreateDossier(session.user.role)) redirect("/dossiers");

  const [clients, suppliers] = await Promise.all([
    prisma.client.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <BackLink href="/dossiers">Retour aux dossiers</BackLink>
      <PageHeader
        title="Nouveau dossier"
        subtitle="Saisissez les informations initiales. Vous pourrez ajouter documents, DUM et statuts ensuite."
      />
      <Card className="p-6">
        <NewDossierForm clients={clients} suppliers={suppliers} />
      </Card>
    </div>
  );
}
