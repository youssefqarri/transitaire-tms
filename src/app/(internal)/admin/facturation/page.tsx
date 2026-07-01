import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { getPlatformBilling } from "@/lib/subscription-billing";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformBillingForm } from "./form";

export const dynamic = "force-dynamic";

export default async function PlatformBillingPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const billing = await getPlatformBilling();

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader
        title="Identité de facturation"
        subtitle="Émetteur des factures d'abonnement adressées aux cabinets (Evead / Escale)"
      />
      <PlatformBillingForm billing={billing} />
    </div>
  );
}
