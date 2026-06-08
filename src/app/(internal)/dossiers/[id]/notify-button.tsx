"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

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
const OTHER = "__OTHER__";

export function NotifyClientButton({
  dossierId,
  clientId,
  clientEmail,
  clientPhone,
  contacts,
  dossierContactEmail,
}: {
  dossierId: string;
  clientId: string;
  clientEmail: string | null;
  clientPhone: string | null;
  contacts: Contact[];
  dossierContactEmail: string | null;
}) {
  void clientId;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [channel, setChannel] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [templateKey, setTemplateKey] = useState("docs_manquants");
  const [preview, setPreview] = useState<{ subject: string | null; body: string } | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  // Destinataire : principal (client.email) + contacts du carnet, ou "Autre".
  const recipientOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    if (clientEmail) opts.push({ value: clientEmail, label: `Principal · ${clientEmail}` });
    for (const c of contacts)
      opts.push({ value: c.email, label: c.name ? `${c.name} · ${c.email}` : c.email });
    return opts;
  }, [clientEmail, contacts]);

  // Choix initial : destinataire mémorisé du dossier > principal > 1er contact > "Autre".
  const known = recipientOptions.map((o) => o.value);
  const [recipient, setRecipient] = useState(
    dossierContactEmail && known.includes(dossierContactEmail)
      ? dossierContactEmail
      : dossierContactEmail
      ? OTHER
      : known[0] ?? OTHER,
  );
  const [otherEmail, setOtherEmail] = useState(
    dossierContactEmail && !known.includes(dossierContactEmail) ? dossierContactEmail : "",
  );
  const [otherName, setOtherName] = useState("");
  const [saveContact, setSaveContact] = useState(false);

  const toAddress = (recipient === OTHER ? otherEmail : recipient).trim();

  // Charge l'aperçu chaque fois que template ou canal change
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ templateKey, channel });
      const res = await fetch(
        `/api/dossiers/${dossierId}/notify/preview?${params}`,
      );
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setPreview(data);
      setEditedSubject(data.subject ?? "");
      setEditedBody(data.body ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [open, templateKey, channel, dossierId]);

  // wa.me link pour fallback WhatsApp
  const waLink = useMemo(() => {
    if (channel !== "WHATSAPP" || !clientPhone) return null;
    const phone = clientPhone.replace(/\D/g, "");
    const text = encodeURIComponent(editedBody);
    return `https://wa.me/${phone}?text=${text}`;
  }, [channel, clientPhone, editedBody]);

  function sendEmail() {
    if (!toAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddress)) {
      toast.error("Destinataire email invalide");
      return;
    }
    if (!editedBody.trim()) {
      toast.error("Message vide");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey,
          channel: "EMAIL",
          lang: "FR",
          customSubject: editedSubject || undefined,
          customBody: editedBody,
          toAddress,
          saveAsContact: recipient === OTHER && saveContact,
          contactName: otherName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur envoi");
        return;
      }
      toast.success("Email envoyé au client");
      setOpen(false);
      router.refresh();
    });
  }

  function openWhatsApp() {
    if (!waLink) return;
    window.open(waLink, "_blank");
    // Enregistre dans l'historique (statut SENT côté semi-auto)
    fetch(`/api/dossiers/${dossierId}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateKey,
        channel: "WHATSAPP",
        lang: "FR",
        customBody: editedBody,
      }),
    });
    toast.info("WhatsApp ouvert — cliquez Envoyer dans WhatsApp");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Send /> Notifier le client
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div>
                <div className="text-[15px] font-semibold">Notifier le client</div>
                <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                  Aperçu et personnalisation du message avant envoi
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center hover:bg-[var(--color-surface-2)] text-[var(--color-fg-mute)]"
                aria-label="Fermer"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="channel">Canal</Label>
                  <Select
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as "EMAIL" | "WHATSAPP")}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP" disabled={!clientPhone}>
                      WhatsApp {clientPhone ? `(${clientPhone})` : "(pas de téléphone)"}
                    </option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    id="template"
                    value={templateKey}
                    onChange={(e) => setTemplateKey(e.target.value)}
                  >
                    {TEMPLATES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {channel === "EMAIL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="recipient">Destinataire</Label>
                  <Select
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  >
                    {recipientOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                    <option value={OTHER}>Autre adresse…</option>
                  </Select>
                  {recipient === OTHER && (
                    <div className="space-y-2 pt-1.5">
                      <Input
                        type="email"
                        value={otherEmail}
                        onChange={(e) => setOtherEmail(e.target.value)}
                        placeholder="email@destinataire.ma"
                      />
                      <Input
                        value={otherName}
                        onChange={(e) => setOtherName(e.target.value)}
                        placeholder="Nom / libellé (optionnel)"
                      />
                      <label className="flex items-center gap-2 text-[12.5px] text-[var(--color-fg-2)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveContact}
                          onChange={(e) => setSaveContact(e.target.checked)}
                          className="accent-[var(--color-accent)] size-4"
                        />
                        Enregistrer ce contact pour le client
                      </label>
                    </div>
                  )}
                </div>
              )}

              {channel === "EMAIL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="subj">Sujet</Label>
                  <Input
                    id="subj"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="min-h-[200px] font-mono text-[12.5px]"
                />
                <p className="text-[11px] text-[var(--color-fg-mute)]">
                  Variables remplacées automatiquement depuis le dossier. Tu peux éditer librement.
                </p>
              </div>

              {channel === "WHATSAPP" && (
                <div className="rounded-[var(--radius)] bg-[var(--color-info-soft)] border border-[var(--color-info)]/30 p-3 text-[12px] text-[var(--color-fg-2)]">
                  WhatsApp ouvrira avec le message pré-rempli. Tu cliques <strong>Envoyer</strong>{" "}
                  dans WhatsApp. L&apos;app enregistrera la notification dans l&apos;historique.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              {channel === "EMAIL" ? (
                <Button size="sm" onClick={sendEmail} disabled={pending || !toAddress}>
                  {pending ? "Envoi…" : "Envoyer l'email"}
                </Button>
              ) : (
                <Button size="sm" onClick={openWhatsApp} disabled={!waLink}>
                  Ouvrir WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
