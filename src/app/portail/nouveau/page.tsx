import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { NewDossierForm } from "./form";

export const dynamic = "force-dynamic";

export default async function PortalNewDossierPage() {
  const session = await auth();
  if (!session?.user.clientId) redirect("/portail");

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <Link
        href="/portail"
        className="inline-flex items-center gap-1 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Mes dossiers
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau dossier</CardTitle>
        </CardHeader>
        <div className="px-5 py-4">
          <p className="text-[13px] text-[var(--color-fg-3)] mb-4">
            Renseignez les informations principales. Notre équipe sera automatiquement
            notifiée et prendra en charge votre dossier dans les meilleurs délais.
          </p>
          <NewDossierForm />
        </div>
      </Card>
    </div>
  );
}
