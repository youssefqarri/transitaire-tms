import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Cloud, Key, ChevronRight, MessageSquare, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const settings = await getSettings();

  const smtpConfigured = !!(settings.smtpHost && settings.smtpUser && settings.smtpPass);
  const s3Configured =
    settings.storageDriver === "s3" &&
    !!(settings.s3Endpoint && settings.s3Bucket && settings.s3AccessKeyId && settings.s3SecretKey);

  const sections = [
    {
      href: "/parametres/email",
      icon: Mail,
      title: "Email sortant (SMTP)",
      description: "Notifications clients par email (Gmail, Outlook, Brevo, Resend…)",
      status: smtpConfigured ? (
        <Badge tone="ok">Configuré · {settings.smtpHost}</Badge>
      ) : (
        <Badge tone="warn">Non configuré</Badge>
      ),
    },
    {
      href: "/parametres/stockage",
      icon: Cloud,
      title: "Stockage des fichiers",
      description: "Local pour le dev, S3 / Backblaze pour la prod",
      status:
        settings.storageDriver === "s3" ? (
          s3Configured ? (
            <Badge tone="ok">S3 · {settings.s3Bucket}</Badge>
          ) : (
            <Badge tone="warn">S3 incomplet</Badge>
          )
        ) : (
          <Badge tone="neutral">Local actif</Badge>
        ),
    },
    {
      href: "/parametres/tokens",
      icon: Key,
      title: "Tokens API",
      description: "Accès programmatique (Claude, scripts d'import, intégrations…)",
    },
    {
      href: "/templates",
      icon: MessageSquare,
      title: "Templates de messages",
      description: "Modèles des notifications email/WhatsApp envoyées aux clients",
    },
    {
      href: "/audit",
      icon: FileText,
      title: "Journal d'audit",
      description: "Trace complète des actions sur la plateforme",
    },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Paramètres</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Configuration de la plateforme. Les valeurs définies ici prennent le pas sur celles du fichier{" "}
          <code className="font-mono text-[12px] bg-[var(--color-surface-2)] px-1 py-0.5 rounded">
            .env
          </code>
          .
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:border-[var(--color-fg-mute)] transition-colors">
              <div className="p-4 flex items-center gap-4">
                <div className="size-9 rounded-[var(--radius)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                  <s.icon className="size-4 text-[var(--color-fg-2)]" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{s.title}</div>
                  <div className="text-[12.5px] text-[var(--color-fg-3)] mt-0.5">
                    {s.description}
                  </div>
                </div>
                {s.status && <div className="hidden sm:block">{s.status}</div>}
                <ChevronRight
                  className="size-4 text-[var(--color-fg-mute)] shrink-0"
                  strokeWidth={1.75}
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
