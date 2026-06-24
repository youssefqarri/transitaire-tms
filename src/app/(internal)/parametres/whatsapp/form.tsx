"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FormState = { waApiUrl: string; waApiKey: string; waSession: string };

export function WhatsAppSettingsForm({
  initial,
  configured,
  adminPhone,
}: {
  initial: FormState;
  configured: boolean;
  adminPhone: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();
  const [testPhone, setTestPhone] = useState(adminPhone);
  const [testResult, setTestResult] = useState<
    | { ok: true; sent?: boolean; status?: string }
    | { ok: false; step: string; error?: string; status?: string }
    | null
  >(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function persist() {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
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
      toast.success("Configuration WhatsApp enregistrée");
      router.refresh();
    });
  }

  function test(withSend: boolean) {
    setTestResult(null);
    startTest(async () => {
      await persist(); // teste la config courante
      const res = await fetch("/api/settings/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withSend ? { to: testPhone } : {}),
      });
      setTestResult(await res.json());
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="waApiUrl">URL de l&apos;API OpenWA / WAHA</Label>
          <Input
            id="waApiUrl"
            value={form.waApiUrl}
            onChange={(e) => set("waApiUrl", e.target.value)}
            placeholder="http://votre-serveur:2785"
            autoComplete="off"
            className="font-mono"
          />
          <p className="text-[11px] text-[var(--color-fg-mute)]">
            Base de l&apos;instance (sans <code>/api</code> à la fin).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="waSession">Session</Label>
            <Input
              id="waSession"
              value={form.waSession}
              onChange={(e) => set("waSession", e.target.value)}
              placeholder="default"
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waApiKey">Clé API (X-API-Key)</Label>
            <Input
              id="waApiKey"
              type="password"
              value={form.waApiKey}
              onChange={(e) => set("waApiKey", e.target.value)}
              placeholder={configured ? "•••••••• (laisser vide = conserver)" : "Votre clé X-API-Key"}
              autoComplete="new-password"
            />
            <p className="text-[11px] text-[var(--color-fg-mute)]">
              Stockée chiffrée. Laisser vide pour conserver la clé actuelle.
            </p>
          </div>
        </div>
      </div>

      {/* Test */}
      <div className="border-t border-[var(--color-border)] pt-5">
        <div className="text-[14px] font-semibold mb-2">Tester la configuration</div>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <Label htmlFor="testPhone">Numéro de test (le vôtre)</Label>
            <Input
              id="testPhone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="font-mono"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => test(false)} disabled={testPending}>
            Vérifier la session
          </Button>
          <Button size="sm" onClick={() => test(true)} disabled={testPending || !testPhone}>
            <Send /> {testPending ? "Test…" : "Envoyer un test"}
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
                  ? `Message envoyé à ${testPhone}. Vérifiez WhatsApp.`
                  : `Session connectée${testResult.status ? ` (${testResult.status})` : ""}.`}
              </span>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <div className="font-medium">
                    Échec ({testResult.step === "verify" ? "session/connexion" : "envoi"})
                    {testResult.status ? ` — statut ${testResult.status}` : ""}
                  </div>
                  <div className="font-mono text-[12px] mt-1">{testResult.error}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statut */}
      <div className="border-t border-[var(--color-border)] pt-5 flex items-center justify-between flex-wrap gap-3">
        <Badge tone={configured ? "ok" : "warn"}>
          {configured ? "Configuré" : "Non configuré"}
        </Badge>
        <Button onClick={save} disabled={savePending}>
          {savePending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
