import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { WhatsAppSettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function WhatsAppSettingsPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const settings = await getSettings();
  const configured = !!(settings.waApiUrl && settings.waApiKey);

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/parametres"
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Paramètres
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">WhatsApp (OpenWA)</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Envoi des notifications clients par WhatsApp via une instance OpenWA / WAHA, en plus
          de l&apos;email. Une fois configuré, le canal « WhatsApp » envoie réellement le message
          depuis l&apos;outil (sinon il ouvre WhatsApp manuellement).
        </p>
      </div>

      <Card>
        <div className="p-5">
          <WhatsAppSettingsForm
            initial={{
              waApiUrl: settings.waApiUrl ?? "",
              // secret jamais renvoyé au navigateur (write-only) : vide = conserver
              waApiKey: "",
              waSession: settings.waSession ?? "default",
            }}
            configured={configured}
            adminPhone=""
          />
        </div>
      </Card>
    </div>
  );
}
