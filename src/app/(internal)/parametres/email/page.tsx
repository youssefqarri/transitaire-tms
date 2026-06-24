import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { EmailSettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const settings = await getSettings();

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/parametres"
        className="inline-flex items-center gap-1 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Paramètres
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Email sortant (SMTP)</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Configuration du serveur SMTP utilisé pour envoyer des notifications aux clients
          (documents manquants, BAE prêt, fiche de liquidation, etc.).
        </p>
      </div>

      <Card>
        <div className="p-5">
          <EmailSettingsForm
            initial={{
              smtpHost: settings.smtpHost ?? "",
              smtpPort: settings.smtpPort ?? 587,
              smtpUser: settings.smtpUser ?? "",
              // secret jamais renvoyé au navigateur (write-only) : laisser vide = conserver
              smtpPass: "",
              smtpFrom: settings.smtpFrom ?? "",
              smtpSecure: settings.smtpSecure,
            }}
            adminEmail={session.user.email}
          />
        </div>
      </Card>
    </div>
  );
}
