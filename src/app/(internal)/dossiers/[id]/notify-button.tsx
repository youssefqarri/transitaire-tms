"use client";

import { useState, useTransition, useMemo, useEffect, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, X, Mail, Info } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

type TemplateInfo = { key: string; label: string };
const TEMPLATES: TemplateInfo[] = [
  { key: "docs_manquants",     label: "Documents manquants" },
  { key: "docs_recus",         label: "Documents reçus" },
  { key: "dossier_ouvert",     label: "Ouverture du dossier" },
  { key: "enregistre_douane",  label: "DUM enregistrée" },
  { key: "visite_programmee",  label: "Visite programmée" },
  { key: "fiche_liquidation",  label: "Fiche de liquidation" },
  { key: "bae_pret",           label: "BAE prêt" },
  { key: "dossier_cloture",    label: "Dossier clôturé" },
];

type Contact = { id: string; name: string | null; email: string };

export function NotifyClientButton({
  dossierId,
  clientId,
  clientEmail,
  clientPhone,
  contacts,
  dossierContactEmail,
  waConfigured,
  label = "Notifier le client",
}: {
  dossierId: string;
  clientId: string;
  clientEmail: string | null;
  clientPhone: string | null;
  contacts: Contact[];
  dossierContactEmail: string | null;
  waConfigured: boolean;
  label?: string;
}) {
  void clientId;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  // Multi-canal : email et/ou WhatsApp
  const [emailOn, setEmailOn] = useState(true);
  const [waOn, setWaOn] = useState(false);
  const [templateKey, setTemplateKey] = useState("docs_manquants");
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  useEffect(() => setMounted(true), []);

  useEscapeClose(open, () => setOpen(false), !pending);

  // Canal « principal » pour charger le bon modèle d'aperçu (email prioritaire).
  const primaryChannel: "EMAIL" | "WHATSAPP" = emailOn ? "EMAIL" : "WHATSAPP";

  const recipientOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    if (clientEmail) opts.push({ value: clientEmail, label: `Principal • ${clientEmail}` });
    for (const c of contacts)
      opts.push({ value: c.email, label: c.name ? `${c.name} • ${c.email}` : c.email });
    return opts;
  }, [clientEmail, contacts]);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Plusieurs destinataires possibles. Initialise avec le contact du dossier
  // (sinon l'email principal du client).
  const [recipients, setRecipients] = useState<string[]>(
    dossierContactEmail ? [dossierContactEmail] : clientEmail ? [clientEmail] : [],
  );
  const [newAddr, setNewAddr] = useState("");
  const [saveContacts, setSaveContacts] = useState(false);

  function addRecipient(addr: string) {
    const a = addr.trim();
    if (!a) return;
    if (!EMAIL_RE.test(a)) {
      toast.error("Adresse email invalide");
      return;
    }
    setRecipients((r) => (r.includes(a) ? r : [...r, a]));
    setNewAddr("");
  }
  function removeRecipient(addr: string) {
    setRecipients((r) => r.filter((x) => x !== addr));
  }
  const toAddress = recipients.join(", ");

  // Aperçu : recharge quand le modèle ou le canal principal change.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ templateKey, channel: primaryChannel });
      const res = await fetch(`/api/dossiers/${dossierId}/notify/preview?${params}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setEditedSubject(data.subject ?? "");
      setEditedBody(data.body ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [open, templateKey, primaryChannel, dossierId]);

  const waLink = useMemo(() => {
    if (!clientPhone) return null;
    const phone = clientPhone.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(editedBody)}`;
  }, [clientPhone, editedBody]);

  async function postNotify(
    channel: "EMAIL" | "WHATSAPP",
    extra: Record<string, unknown>,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/dossiers/${dossierId}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateKey, channel, lang: "FR", customBody: editedBody, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: (data as { error?: string }).error };
  }

  function send() {
    if (!emailOn && !waOn) {
      toast.error("Choisis au moins un canal");
      return;
    }
    if (!editedBody.trim()) {
      toast.error("Message vide");
      return;
    }
    if (emailOn && (recipients.length === 0 || recipients.some((a) => !EMAIL_RE.test(a)))) {
      toast.error("Ajoute au moins une adresse email valide");
      return;
    }
    // wa.me (repli non configuré) doit s'ouvrir dans le geste utilisateur, avant tout await.
    if (waOn && !waConfigured && waLink) window.open(waLink, "_blank");

    start(async () => {
      const results: { label: string; ok: boolean; error?: string }[] = [];
      if (emailOn) {
        const r = await postNotify("EMAIL", {
          customSubject: editedSubject || undefined,
          toAddress,
          saveAsContact: saveContacts,
        });
        results.push({ label: "Email", ...r });
      }
      if (waOn) {
        const r = await postNotify("WHATSAPP", {});
        results.push({ label: "WhatsApp", ...r });
      }
      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        toast.success(
          results.length > 1 ? "Envoyé par email + WhatsApp" : `${results[0].label} envoyé au client`,
        );
        setOpen(false);
      } else {
        failed.forEach((f) => toast.error(`${f.label} : ${f.error || "échec"}`));
      }
      router.refresh();
    });
  }

  const sendDisabled = pending || (!emailOn && !waOn) || (emailOn && recipients.length === 0);

  const modal = (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 sm:p-6"
      onMouseDown={backdropDismiss(() => setOpen(false))}
    >
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)] w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <div className="text-[14px] font-semibold">Notifier le client</div>
            <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
              Aperçu et personnalisation du message avant envoi
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center hover:bg-[var(--color-surface-2)] text-[var(--color-fg-mute)]"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Canal d&apos;envoi</Label>
              <div className="flex gap-2">
                <ChannelToggle
                  active={emailOn}
                  onClick={() => setEmailOn((v) => !v)}
                  icon={Mail}
                  label="Email"
                />
                <ChannelToggle
                  active={waOn}
                  disabled={!clientPhone}
                  onClick={() => setWaOn((v) => !v)}
                  icon={WhatsAppIcon}
                  label="WhatsApp"
                  title={clientPhone ? clientPhone : "Pas de téléphone client"}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template">Template</Label>
              <Select id="template" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                {TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {emailOn && (
            <div className="space-y-2">
              <Label>Destinataires (email)</Label>
              {/* puces des destinataires sélectionnés */}
              <div className="flex flex-wrap gap-1.5">
                {recipients.length === 0 && (
                  <span className="text-[12px] text-[var(--color-fg-mute)]">Aucun destinataire</span>
                )}
                {recipients.map((addr) => (
                  <span
                    key={addr}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                  >
                    {addr}
                    <button
                      type="button"
                      onClick={() => removeRecipient(addr)}
                      className="text-[var(--color-fg-mute)] hover:text-[var(--color-danger)]"
                      aria-label={`Retirer ${addr}`}
                    >
                      <X className="size-3" strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
              {/* ajout depuis les contacts connus */}
              {recipientOptions.some((o) => !recipients.includes(o.value)) && (
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addRecipient(e.target.value);
                  }}
                >
                  <option value="">Ajouter un contact connu…</option>
                  {recipientOptions
                    .filter((o) => !recipients.includes(o.value))
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </Select>
              )}
              {/* ajout d'une adresse libre */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient(newAddr);
                    }
                  }}
                  placeholder="autre@adresse.ma"
                />
                <Button type="button" variant="outline" onClick={() => addRecipient(newAddr)}>
                  Ajouter
                </Button>
              </div>
              <label className="inline-flex w-fit items-center gap-2 text-[13px] text-[var(--color-fg-2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveContacts}
                  onChange={(e) => setSaveContacts(e.target.checked)}
                  className="accent-[var(--color-accent)] size-4"
                />
                Enregistrer les nouvelles adresses comme contacts du client
              </label>
            </div>
          )}

          {emailOn && (
            <div className="space-y-1.5">
              <Label htmlFor="subj">Sujet (email)</Label>
              <Input id="subj" value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="min-h-[200px] font-mono text-[13px]"
            />
            <p className="flex items-start gap-1.5 text-[11px] text-[var(--color-fg-3)]">
              <Info className="size-3.5 shrink-0 mt-px text-[var(--color-fg-mute)]" />
              <span>
                Variables remplacées automatiquement depuis le dossier. Le même message part sur les
                canaux sélectionnés.
              </span>
            </p>
          </div>

          {waOn && (
            <div className="rounded-[var(--radius)] bg-[var(--color-info-soft)] border border-[var(--color-info)]/30 p-3 text-[12px] text-[var(--color-fg-2)]">
              {waConfigured ? (
                <>
                  WhatsApp sera <strong>envoyé directement</strong>
                  {clientPhone ? ` au ${clientPhone}` : ""}{" "}depuis l&apos;outil.
                </>
              ) : (
                <>
                  WhatsApp s&apos;ouvrira avec le message pré-rempli (clique{" "}
                  <strong>Envoyer</strong> dans WhatsApp). L&apos;envoi est aussi tracé dans
                  l&apos;historique.
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={send} disabled={sendDisabled}>
            <Send /> {pending ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Send /> {label}
      </Button>
      {mounted && open && createPortal(modal, document.body)}
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
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-[var(--radius)] border text-[13px] transition-colors ${
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium"
          : "border-[var(--color-border-2)] text-[var(--color-fg-3)] hover:bg-[var(--color-surface-2)]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <Icon className="size-4" strokeWidth={1.75} /> {label}
    </button>
  );
}
