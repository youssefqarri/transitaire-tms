import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Database, Cloud } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Configuration de la plateforme
        </p>
      </div>
      <Card>
        <div className="p-5 border-b border-[var(--color-border)] font-semibold flex items-center gap-2">
          <Mail className="size-4" /> Intégration Gmail
        </div>
        <div className="p-5 text-sm space-y-3">
          <p className="text-[var(--color-muted-foreground)]">
            Connectez un compte Gmail/Google Workspace pour synchroniser automatiquement les emails entrants
            (douane, Portnet, MCI, clients) et les rattacher aux dossiers.
          </p>
          <div className="flex items-center gap-3">
            <Badge tone={process.env.GOOGLE_CLIENT_ID ? "ok" : "warn"}>
              {process.env.GOOGLE_CLIENT_ID ? "OAuth configuré" : "OAuth non configuré"}
            </Badge>
            {!process.env.GOOGLE_CLIENT_ID && (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Renseignez GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET dans .env
              </span>
            )}
          </div>
          {process.env.GOOGLE_CLIENT_ID && (
            <a
              href="/api/auth/gmail/start"
              className="inline-flex h-9 items-center gap-2 px-4 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90"
            >
              Connecter Gmail
            </a>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-5 border-b border-[var(--color-border)] font-semibold flex items-center gap-2">
          <Database className="size-4" /> Base de données
        </div>
        <div className="p-5 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted-foreground)]">Statut</span>
            <Badge tone="ok">Connectée</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 border-b border-[var(--color-border)] font-semibold flex items-center gap-2">
          <Cloud className="size-4" /> Stockage fichiers
        </div>
        <div className="p-5 text-sm text-[var(--color-muted-foreground)]">
          Stockage local : <code className="text-[var(--color-foreground)]">{process.env.UPLOAD_DIR || "./uploads"}</code>
          <div className="mt-2 text-xs">
            Pour la production, configurer un stockage S3 ou équivalent (à venir).
          </div>
        </div>
      </Card>
    </div>
  );
}
