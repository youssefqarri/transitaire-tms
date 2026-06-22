import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { InvoiceNumberForm } from "./form";

export const dynamic = "force-dynamic";

export default async function InvoiceSettingsPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const settings = await getSettings();
  const current =
    settings.invoiceSeqYear && settings.invoiceSeqFloor
      ? `FA${String(settings.invoiceSeqYear).slice(-2)}${String(settings.invoiceSeqFloor).padStart(4, "0")}`
      : "";

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/parametres"
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Paramètres
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Numérotation des factures</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Lors de la reprise de votre numérotation, fixez le prochain numéro de la série FA.
          L&apos;outil continuera ensuite automatiquement (le numéro suivant, puis +1 à chaque
          facture).
        </p>
      </div>

      <Card>
        <div className="p-5">
          <InvoiceNumberForm current={current} />
        </div>
      </Card>
    </div>
  );
}
