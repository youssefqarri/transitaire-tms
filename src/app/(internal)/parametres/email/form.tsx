"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FormState = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpSecure: boolean;
};

const PRESETS = [
  {
    name: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    help: "Activer la 2FA puis générer un mot de passe d'application sur myaccount.google.com/apppasswords",
  },
  {
    name: "Outlook / Microsoft 365",
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    help: "Authentification de base à activer dans l'admin Microsoft 365",
  },
  {
    name: "AWS (Simple Email Service)",
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    help: "Adapter la région si besoin (us-east-1 par défaut). User / pass = identifiants SMTP générés dans SES (≠ clés console AWS). Expéditeur = adresse ou domaine vérifié dans SES.",
  },
  {
    name: "Brevo (Sendinblue)",
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    help: "300 emails/jour gratuit, recommandé pour la prod",
  },
  {
    name: "Resend",
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    help: "3000/mois gratuit, user = 'resend', pass = API key",
  },
];

export function EmailSettingsForm({
  initial,
  adminEmail,
}: {
  initial: FormState;
  adminEmail: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();
  const [testResult, setTestResult] = useState<
    | { ok: true; verified: true; sent?: boolean }
    | { ok: false; step: string; error: string }
    | null
  >(null);
  const [testEmail, setTestEmail] = useState(adminEmail);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function applyPreset(p: (typeof PRESETS)[number]) {
    setForm((f) => ({ ...f, smtpHost: p.host, smtpPort: p.port, smtpSecure: p.secure }));
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

  function test(withSend: boolean) {
    setTestResult(null);
    startTest(async () => {
      // d'abord on sauve les valeurs courantes (pour que verifySmtp lise la DB)
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const res = await fetch("/api/settings/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withSend ? { to: testEmail } : {}),
      });
      const data = await res.json();
      setTestResult(data);
    });
  }

  return (
    <div className="space-y-6">
      {/* Presets rapides */}
      <div>
        <Label className="mb-2 block">Modèles rapides</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-[12px] rounded-[var(--radius)] border border-[var(--color-border-2)] hover:bg-[var(--color-surface-2)]"
              title={p.help}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="smtpHost">Serveur SMTP</Label>
          <Input
            id="smtpHost"
            value={form.smtpHost}
            onChange={(e) => set("smtpHost", e.target.value)}
            placeholder="smtp.gmail.com"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtpPort">Port</Label>
          <Input
            id="smtpPort"
            type="number"
            value={form.smtpPort}
            onChange={(e) => set("smtpPort", Number(e.target.value))}
            placeholder="587"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtpSecure">Sécurité</Label>
          <Select
            id="smtpSecure"
            value={form.smtpSecure ? "ssl" : "starttls"}
            onChange={(e) => set("smtpSecure", e.target.value === "ssl")}
          >
            <option value="starttls">STARTTLS (port 587 — recommandé)</option>
            <option value="ssl">SSL direct (port 465)</option>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="smtpUser">Utilisateur / email</Label>
          <Input
            id="smtpUser"
            value={form.smtpUser}
            onChange={(e) => set("smtpUser", e.target.value)}
            placeholder="votre-email@gmail.com"
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="smtpPass">Mot de passe / App Password</Label>
          <Input
            id="smtpPass"
            type="password"
            value={form.smtpPass}
            onChange={(e) => set("smtpPass", e.target.value)}
            placeholder="••••••••••••••••"
            autoComplete="new-password"
          />
          <p className="text-[11px] text-[var(--color-fg-mute)]">
            Pour Gmail : mot de passe d&apos;application 16 caractères (pas le mot de passe du compte).
          </p>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="smtpFrom">Expéditeur affiché</Label>
          <Input
            id="smtpFrom"
            value={form.smtpFrom}
            onChange={(e) => set("smtpFrom", e.target.value)}
            placeholder='Cabinet Transit <notif@cabinet.ma>'
          />
          <p className="text-[11px] text-[var(--color-fg-mute)]">
            Doit correspondre à l&apos;utilisateur SMTP (Gmail bloque les expéditeurs différents).
          </p>
        </div>
      </div>

      {/* Test */}
      <div className="border-t border-[var(--color-border)] pt-5">
        <div className="text-[14px] font-semibold mb-2">Tester la configuration</div>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <Label htmlFor="testEmail">Email de test (vous-même)</Label>
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => test(false)} disabled={testPending}>
            Vérifier la connexion
          </Button>
          <Button size="sm" onClick={() => test(true)} disabled={testPending || !testEmail}>
            <Send /> {testPending ? "Test…" : "Envoyer un email test"}
          </Button>
        </div>
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
                {testResult.sent
                  ? `Email envoyé à ${testEmail}. Vérifie ta boîte (et les spams).`
                  : "Connexion SMTP OK."}
              </span>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <div className="font-medium">
                    Échec ({testResult.step === "verify" ? "auth/connexion" : "envoi"})
                  </div>
                  <div className="font-mono text-[12px] mt-1">{testResult.error}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status actuel */}
      <div className="border-t border-[var(--color-border)] pt-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={initial.smtpHost && initial.smtpUser && initial.smtpPass ? "ok" : "warn"}>
            {initial.smtpHost && initial.smtpUser && initial.smtpPass
              ? "Configuré"
              : "Non configuré"}
          </Badge>
          {initial.smtpHost && (
            <span className="text-[12px] text-[var(--color-fg-3)] font-mono">
              {initial.smtpHost}:{initial.smtpPort}
            </span>
          )}
        </div>
        <Button onClick={save} disabled={savePending}>
          {savePending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
