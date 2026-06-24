import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getIssuer } from "@/lib/invoicing-server";
import { Card } from "@/components/ui/card";
import { IssuerSettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function IssuerSettingsPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const issuer = await getIssuer();

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/parametres"
        className="inline-flex items-center gap-1 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Paramètres
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Coordonnées de l&apos;entreprise
        </h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Émetteur affiché en en-tête et en pied des factures. Modifiable sans redéploiement.
        </p>
      </div>

      <Card>
        <div className="p-5">
          <IssuerSettingsForm initial={issuer} />
        </div>
      </Card>
    </div>
  );
}
