"use client";

import { useState, useTransition, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Bell, Mail, X, Paperclip, BellRing } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

type Result = { email: boolean; whatsapp: boolean; notif: boolean; errors: string[]; ok: boolean };

function summarize(r: Result): string {
  const ok = [r.email && "email", r.whatsapp && "WhatsApp", r.notif && "notification"].filter(Boolean);
  return ok.length ? ok.join(", ") : "aucun canal";
}

// Envoi/relance d'une facture d'abonnement AVEC aperçu du mail avant validation.
export function InvoiceSendButtons({ invoiceId, unpaid }: { invoiceId: string; unpaid: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminder, setReminder] = useState(false);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emailOn, setEmailOn] = useState(true);
  const [waOn, setWaOn] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);
  const [waConfigured, setWaConfigured] = useState(false);

  useEscapeClose(open, () => setOpen(false), !pending);

  async function openCompose(isReminder: boolean) {
    setReminder(isReminder);
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/subscription-invoices/${invoiceId}/send/preview${isReminder ? "?reminder=1" : ""}`,
      );
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error ?? "Aperçu indisponible");
        setOpen(false);
        return;
      }
      setTo(d.to ?? "");
      setSubject(d.subject ?? "");
      setBody(d.body ?? "");
      setPhone(d.phone ?? null);
      setWaConfigured(!!d.whatsappConfigured);
      setEmailOn(true);
      setWaOn(!!d.phone && !!d.whatsappConfigured);
      setNotifOn(true);
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    if (!emailOn && !waOn && !notifOn) return toast.error("Choisis au moins un canal");
    if (emailOn && !to.trim()) return toast.error("Destinataire email requis");
    if (emailOn && !body.trim()) return toast.error("Le message est vide");
    start(async () => {
      const res = await fetch(
        `/api/admin/subscription-invoices/${invoiceId}/send${reminder ? "?reminder=1" : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: to.trim(),
            subject,
            body,
            channels: { email: emailOn, whatsapp: waOn, notif: notifOn },
          }),
        },
      );
      const data: Result = await res
        .json()
        .catch(() => ({ email: false, whatsapp: false, notif: false, ok: false, errors: [] }));
      if (!res.ok || !data.ok) {
        toast.error(`Échec : ${data.errors?.join(" · ") || "envoi impossible"}`);
        return;
      }
      const base = reminder ? "Relance envoyée" : "Facture envoyée";
      if (data.errors?.length) toast.warning(`${base} (${summarize(data)}) — ${data.errors.join(" · ")}`);
      else toast.success(`${base} : ${summarize(data)}`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => openCompose(false)} title="Envoyer la facture">
        <Send /> Envoyer
      </Button>
      {unpaid && (
        <Button variant="ghost" size="sm" onClick={() => openCompose(true)} title="Relancer">
          <Bell /> Relancer
        </Button>
      )}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 sm:p-6"
            onMouseDown={backdropDismiss(() => !pending && setOpen(false))}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="text-[14px] font-semibold flex items-center gap-2">
                    {reminder ? <BellRing className="size-4" /> : <Mail className="size-4" />}
                    {reminder ? "Relancer — aperçu du mail" : "Envoyer la facture — aperçu du mail"}
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                    Vérifie et ajuste le message avant l'envoi
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center hover:bg-[var(--color-surface-2)] text-[var(--color-fg-mute)]"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loading ? (
                  <div className="py-10 text-center text-[13px] text-[var(--color-fg-mute)]">
                    Chargement de l'aperçu…
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>Canaux</Label>
                      <div className="flex gap-2">
                        <ChannelToggle active={emailOn} onClick={() => setEmailOn((v) => !v)} icon={Mail} label="Email" />
                        <ChannelToggle
                          active={waOn}
                          disabled={!phone || !waConfigured}
                          onClick={() => setWaOn((v) => !v)}
                          icon={WhatsAppIcon}
                          label="WhatsApp"
                          title={!phone ? "Pas de téléphone cabinet" : !waConfigured ? "WhatsApp non configuré" : phone}
                        />
                        <ChannelToggle active={notifOn} onClick={() => setNotifOn((v) => !v)} icon={Bell} label="Notification" />
                      </div>
                    </div>

                    {emailOn && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="to">Destinataire (email)</Label>
                          <Input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="subj">Objet</Label>
                          <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="body">Message</Label>
                      <Textarea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="min-h-[220px] text-[13px]"
                      />
                    </div>

                    {emailOn && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-fg-3)]">
                        <Paperclip className="size-3.5" /> Le PDF de la facture sera joint à l'email.
                      </div>
                    )}
                    {waOn && (
                      <div className="rounded-[var(--radius)] bg-[var(--color-info-soft)] border border-[var(--color-info)]/30 p-3 text-[12px] text-[var(--color-fg-2)]">
                        Le message (sans PDF) part aussi sur WhatsApp{phone ? ` au ${phone}` : ""}.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={submit} disabled={pending || loading}>
                  <Send /> {pending ? "Envoi…" : reminder ? "Envoyer la relance" : "Envoyer"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function ChannelToggle({
  active,
  disabled,
  onClick,
  icon: Icon,
  label,
  title,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  title?: string;
}) {
  return (
    <span className="flex-1 inline-flex" title={disabled ? title : undefined}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        title={disabled ? undefined : title}
        aria-pressed={active}
        className={`w-full flex items-center justify-center gap-2 h-9 rounded-[var(--radius)] border text-[13px] transition-colors ${
          active
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium"
            : "border-[var(--color-border-2)] text-[var(--color-fg-3)] hover:bg-[var(--color-surface-2)]"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <Icon className="size-4" strokeWidth={1.75} /> {label}
      </button>
    </span>
  );
}
