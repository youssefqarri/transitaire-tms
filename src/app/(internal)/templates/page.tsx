import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { orgScope } from "@/lib/tenant";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS, LANG_LABELS, TEMPLATE_KEYS } from "@/lib/messaging";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  docs_manquants: "Demande de documents au client",
  docs_recus: "Confirmation de réception des documents",
  dossier_ouvert: "Notification d'ouverture de dossier",
  enregistre_douane: "DUM enregistrée à BADR",
  visite_programmee: "Visite douane programmée",
  fiche_liquidation: "Fiche de liquidation envoyée",
  bae_pret: "Bon à enlever définitif obtenu",
  dossier_cloture: "Dossier clôturé — remerciements",
};

export default async function TemplatesPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");

  const templates = await prisma.messageTemplate.findMany({
    where: { ...orgScope(session.user.orgId) },
    orderBy: [{ key: "asc" }, { channel: "asc" }, { lang: "asc" }],
  });

  const byKey = new Map<string, typeof templates>();
  for (const t of templates) {
    if (!byKey.has(t.key)) byKey.set(t.key, []);
    byKey.get(t.key)!.push(t);
  }

  const allKeys = Object.values(TEMPLATE_KEYS);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Templates de messages</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Modèles de communications clients par email et WhatsApp. Variables : <code className="font-mono text-[12px] bg-[var(--color-surface-2)] px-1 py-0.5 rounded">{`{{client.name}}`}</code>, <code className="font-mono text-[12px] bg-[var(--color-surface-2)] px-1 py-0.5 rounded">{`{{dossier.number}}`}</code>, etc.
        </p>
      </header>

      <div className="space-y-3">
        {allKeys.map((key) => {
          const variants = byKey.get(key) ?? [];
          const desc = TEMPLATE_DESCRIPTIONS[key] ?? key;
          return (
            <Card key={key}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
                <div>
                  <div className="font-mono text-[12px] text-[var(--color-fg-3)]">{key}</div>
                  <div className="text-[13px] font-medium mt-0.5">{desc}</div>
                </div>
                <Link
                  href={`/templates/${key}`}
                  className="text-[12px] text-[var(--color-accent)] hover:underline"
                >
                  Éditer →
                </Link>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-2">
                {variants.length === 0 ? (
                  <span className="text-[12px] text-[var(--color-fg-3)] italic">
                    Aucun template défini · les défauts intégrés seront utilisés
                  </span>
                ) : (
                  variants.map((v) => (
                    <Badge key={v.id} tone={v.active ? "info" : "neutral"}>
                      {CHANNEL_LABELS[v.channel]} · {LANG_LABELS[v.lang]}
                    </Badge>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
