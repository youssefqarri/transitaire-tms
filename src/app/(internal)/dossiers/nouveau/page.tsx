import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDossier } from "@/lib/roles";
import { Card } from "@/components/ui/card";
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
      <div>
        <Link
          href="/dossiers"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-4" /> Retour aux dossiers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-3">
          Nouveau dossier
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Saisissez les informations initiales. Vous pourrez ajouter documents, DUM et statuts ensuite.
        </p>
      </div>

      <Card className="p-6">
        <NewDossierForm clients={clients} suppliers={suppliers} />
      </Card>
    </div>
  );
}
