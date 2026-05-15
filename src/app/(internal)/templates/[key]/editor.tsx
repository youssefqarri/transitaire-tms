"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, MessageCircle, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Email = { subject: string | null; body: string };
type WhatsApp = { body: string };

export function TemplateEditor({
  templateKey,
  emailDefault,
  whatsappDefault,
  emailCustom,
  whatsappCustom,
}: {
  templateKey: string;
  emailDefault: Email;
  whatsappDefault: WhatsApp;
  emailCustom: { subject: string; body: string; active: boolean } | null;
  whatsappCustom: { body: string; active: boolean } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [emailSubject, setEmailSubject] = useState(
    emailCustom?.subject ?? emailDefault.subject ?? "",
  );
  const [emailBody, setEmailBody] = useState(emailCustom?.body ?? emailDefault.body);
  const [emailActive, setEmailActive] = useState(emailCustom?.active ?? false);
  const emailIsCustom = !!emailCustom;

  const [waBody, setWaBody] = useState(whatsappCustom?.body ?? whatsappDefault.body);
  const [waActive, setWaActive] = useState(whatsappCustom?.active ?? false);
  const waIsCustom = !!whatsappCustom;
  const [resetTarget, setResetTarget] = useState<"EMAIL" | "WHATSAPP" | null>(null);

  function saveEmail() {
    start(async () => {
      const res = await fetch(`/api/templates/${templateKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "EMAIL",
          lang: "FR",
          subject: emailSubject,
          body: emailBody,
          active: emailActive,
        }),
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success("Template email enregistré");
      router.refresh();
    });
  }

  function saveWhatsApp() {
    start(async () => {
      const res = await fetch(`/api/templates/${templateKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "WHATSAPP",
          lang: "FR",
          subject: null,
          body: waBody,
          active: waActive,
        }),
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success("Template WhatsApp enregistré");
      router.refresh();
    });
  }

  function doReset() {
    if (!resetTarget) return;
    const channel = resetTarget;
    start(async () => {
      const res = await fetch(`/api/templates/${templateKey}?channel=${channel}&lang=FR`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success("Réinitialisé au défaut");
      setResetTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* EMAIL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
            Email
            <span className={`ml-2 text-[10.5px] font-medium uppercase tracking-wider ${emailIsCustom ? "text-[var(--color-accent)]" : "text-[var(--color-fg-mute)]"}`}>
              {emailIsCustom ? "Personnalisé" : "Défaut"}
            </span>
          </CardTitle>
          <label className="flex items-center gap-2 text-[12px] text-[var(--color-fg-2)] cursor-pointer">
            <input
              type="checkbox"
              checked={emailActive}
              onChange={(e) => setEmailActive(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Actif
          </label>
        </CardHeader>
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="esubj">Sujet</Label>
            <Input
              id="esubj"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ebody">Corps</Label>
            <Textarea
              id="ebody"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="min-h-[220px] font-mono text-[12.5px]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            {emailIsCustom && (
              <Button variant="ghost" size="sm" onClick={() => setResetTarget("EMAIL")} disabled={pending}>
                <RotateCcw /> Réinitialiser
              </Button>
            )}
            <Button size="sm" onClick={saveEmail} disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer l'email"}
            </Button>
          </div>
        </div>
      </Card>

      {/* WHATSAPP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-4 text-[var(--color-fg-mute)]" strokeWidth={1.75} />
            WhatsApp
            <span className={`ml-2 text-[10.5px] font-medium uppercase tracking-wider ${waIsCustom ? "text-[var(--color-accent)]" : "text-[var(--color-fg-mute)]"}`}>
              {waIsCustom ? "Personnalisé" : "Défaut"}
            </span>
          </CardTitle>
          <label className="flex items-center gap-2 text-[12px] text-[var(--color-fg-2)] cursor-pointer">
            <input
              type="checkbox"
              checked={waActive}
              onChange={(e) => setWaActive(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Actif
          </label>
        </CardHeader>
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wbody">Message</Label>
            <Textarea
              id="wbody"
              value={waBody}
              onChange={(e) => setWaBody(e.target.value)}
              className="min-h-[140px] font-mono text-[12.5px]"
            />
            <p className="text-[11px] text-[var(--color-fg-mute)]">
              Tu peux utiliser *gras*, _italique_ et ~barré~ (formatage WhatsApp).
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            {waIsCustom && (
              <Button variant="ghost" size="sm" onClick={() => setResetTarget("WHATSAPP")} disabled={pending}>
                <RotateCcw /> Réinitialiser
              </Button>
            )}
            <Button size="sm" onClick={saveWhatsApp} disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer WhatsApp"}
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        title="Réinitialiser au défaut ?"
        description="Le template personnalisé sera supprimé et la version par défaut sera utilisée à la place."
        confirmLabel="Réinitialiser"
        tone="warn"
        pending={pending}
        onConfirm={doReset}
      />
    </div>
  );
}
