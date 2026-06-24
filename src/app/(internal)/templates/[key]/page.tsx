import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { loadTemplate, TEMPLATE_KEYS, type TemplateKey } from "@/lib/messaging";
import { Card } from "@/components/ui/card";
import { TemplateEditor } from "./editor";

export const dynamic = "force-dynamic";

const DESCRIPTIONS: Record<string, string> = {
  docs_manquants: "Demande de documents au client",
  docs_recus: "Confirmation de réception des documents",
  dossier_ouvert: "Notification d'ouverture de dossier",
  enregistre_douane: "DUM enregistrée à BADR",
  visite_programmee: "Visite douane programmée",
  fiche_liquidation: "Fiche de liquidation envoyée",
  bae_pret: "Bon à enlever définitif obtenu",
  dossier_cloture: "Dossier clôturé — remerciements",
};

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");

  // Valider la key
  if (!Object.values(TEMPLATE_KEYS).includes(key as TemplateKey)) {
    notFound();
  }

  // Charger les valeurs effectives (DB > défauts) pour les 2 canaux FR
  const [emailEffective, whatsappEffective, dbRows] = await Promise.all([
    loadTemplate(key as TemplateKey, "EMAIL", "FR"),
    loadTemplate(key as TemplateKey, "WHATSAPP", "FR"),
    prisma.messageTemplate.findMany({ where: { deletedAt: null, key } }),
  ]);

  const emailDb = dbRows.find((r) => r.channel === "EMAIL" && r.lang === "FR");
  const whatsappDb = dbRows.find((r) => r.channel === "WHATSAPP" && r.lang === "FR");

  return (
    <div className="max-w-4xl space-y-5">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Templates
      </Link>

      <div>
        <div className="font-mono text-[12px] text-[var(--color-fg-3)]">{key}</div>
        <h1 className="text-[22px] font-semibold tracking-tight mt-1">
          {DESCRIPTIONS[key] ?? key}
        </h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Modèle utilisé pour notifier le client. Variables disponibles :{" "}
          {[
            "{{client.name}}",
            "{{client.contactName}}",
            "{{dossier.number}}",
            "{{dossier.reference}}",
            "{{user.name}}",
            "{{dum.number}}",
            "{{visitDate}}",
            "{{missingList}}",
            "{{portalUrl}}",
          ].map((v) => (
            <code
              key={v}
              className="font-mono text-[12px] bg-[var(--color-surface-2)] px-1 py-0.5 rounded mr-1"
            >
              {v}
            </code>
          ))}
        </p>
      </div>

      <TemplateEditor
        templateKey={key}
        emailDefault={emailEffective}
        whatsappDefault={whatsappEffective}
        emailCustom={
          emailDb
            ? {
                subject: emailDb.subject ?? "",
                body: emailDb.body,
                active: emailDb.active,
              }
            : null
        }
        whatsappCustom={
          whatsappDb
            ? {
                body: whatsappDb.body,
                active: whatsappDb.active,
              }
            : null
        }
      />
    </div>
  );
}
