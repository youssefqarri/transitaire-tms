"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FormState = {
  storageDriver: "local" | "s3";
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretKey: string;
  s3PublicBaseUrl: string;
};

const PRESETS = [
  {
    name: "Backblaze B2",
    endpointTpl: "https://s3.<region>.backblazeb2.com",
    regionExample: "eu-central-003",
    help: "Régions B2 : us-east-005, us-west-004, eu-central-003, etc.",
  },
  {
    name: "AWS S3",
    endpointTpl: "https://s3.<region>.amazonaws.com",
    regionExample: "eu-west-3",
    help: "Région ex. eu-west-3 (Paris), us-east-1, etc.",
  },
  {
    name: "Cloudflare R2",
    endpointTpl: "https://<account-id>.r2.cloudflarestorage.com",
    regionExample: "auto",
    help: "Région à 'auto' pour R2",
  },
];

export function StorageSettingsForm({ initial }: { initial: FormState }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function save() {
    startSave(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Erreur enregistrement");
        return;
      }
      toast.success("Configuration enregistrée");
      router.refresh();
    });
  }

  function test() {
    setTestResult(null);
    startTest(async () => {
      // sauve d'abord pour que testConnection lise la DB
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const res = await fetch("/api/settings/test-storage", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    });
  }

  return (
    <div className="space-y-6">
      {/* Driver */}
      <div className="space-y-1.5">
        <Label htmlFor="driver">Pilote de stockage</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => set("storageDriver", "local")}
            className={`text-left p-3 rounded-[var(--radius)] border transition-colors ${
              form.storageDriver === "local"
                ? "border-[var(--color-fg)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border-2)] hover:bg-[var(--color-surface-2)]"
            }`}
          >
            <div className="text-[13px] font-medium">Local (filesystem)</div>
            <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
              ./uploads — pour le développement
            </div>
          </button>
          <button
            type="button"
            onClick={() => set("storageDriver", "s3")}
            className={`text-left p-3 rounded-[var(--radius)] border transition-colors ${
              form.storageDriver === "s3"
                ? "border-[var(--color-fg)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border-2)] hover:bg-[var(--color-surface-2)]"
            }`}
          >
            <div className="text-[13px] font-medium">S3 / Backblaze / R2</div>
            <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
              Production — fichiers chez un provider cloud
            </div>
          </button>
        </div>
      </div>

      {form.storageDriver === "s3" && (
        <>
          <div>
            <Label className="mb-2 block">Modèles rapides</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <span
                  key={p.name}
                  className="px-3 py-1.5 text-[12px] rounded-[var(--radius)] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                  title={p.help}
                >
                  {p.name}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-fg-mute)] mt-2">
              Backblaze : endpoint <code className="font-mono">s3.&lt;region&gt;.backblazeb2.com</code>,
              région ex. <code className="font-mono">eu-central-003</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="endpoint">Endpoint S3</Label>
              <Input
                id="endpoint"
                value={form.s3Endpoint}
                onChange={(e) => set("s3Endpoint", e.target.value)}
                placeholder="https://s3.eu-central-003.backblazeb2.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region">Région</Label>
              <Input
                id="region"
                value={form.s3Region}
                onChange={(e) => set("s3Region", e.target.value)}
                placeholder="eu-central-003"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bucket">Bucket</Label>
              <Input
                id="bucket"
                value={form.s3Bucket}
                onChange={(e) => set("s3Bucket", e.target.value)}
                placeholder="transitaire-tms-prod"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessKey">Access Key ID</Label>
              <Input
                id="accessKey"
                value={form.s3AccessKeyId}
                onChange={(e) => set("s3AccessKeyId", e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="secret">Secret Access Key</Label>
              <Input
                id="secret"
                type="password"
                value={form.s3SecretKey}
                onChange={(e) => set("s3SecretKey", e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="publicUrl">URL publique (optionnel)</Label>
              <Input
                id="publicUrl"
                value={form.s3PublicBaseUrl}
                onChange={(e) => set("s3PublicBaseUrl", e.target.value)}
                placeholder="https://files.cabinet.ma  (CDN devant le bucket)"
              />
              <p className="text-[11px] text-[var(--color-fg-mute)]">
                Laisser vide pour utiliser des URLs signées (5 min). À remplir uniquement si le bucket
                est public via un CDN.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Test */}
      <div className="border-t border-[var(--color-border)] pt-5">
        <div className="text-[14px] font-semibold mb-2">Tester la configuration</div>
        <p className="text-[12px] text-[var(--color-fg-3)] mb-3">
          Effectue un PUT puis DELETE d&apos;un petit fichier pour vérifier que les credentials et les
          permissions sont OK.
        </p>
        <Button variant="outline" size="sm" onClick={test} disabled={testPending}>
          {testPending ? "Test en cours…" : "Tester la connexion"}
        </Button>
        {testResult && (
          <div
            className={`mt-3 rounded-[var(--radius)] border p-3 text-[13px] ${
              testResult.ok
                ? "border-[var(--color-success)]/30 bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
            }`}
          >
            {testResult.ok ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4" strokeWidth={2} />
                Connexion OK — PUT et DELETE réussis.
              </span>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <div className="font-medium">Échec</div>
                  <div className="font-mono text-[12px] mt-1">{testResult.error}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] pt-5 flex items-center justify-between flex-wrap gap-3">
        <Badge
          tone={
            form.storageDriver === "local" ||
            (form.s3Endpoint && form.s3Bucket && form.s3AccessKeyId && form.s3SecretKey)
              ? "ok"
              : "warn"
          }
        >
          {form.storageDriver === "local"
            ? "Local actif"
            : form.s3Bucket
            ? `S3 — ${form.s3Bucket}`
            : "S3 incomplet"}
        </Badge>
        <Button onClick={save} disabled={savePending}>
          {savePending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
