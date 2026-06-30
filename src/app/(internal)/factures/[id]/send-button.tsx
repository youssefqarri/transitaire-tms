"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

export function SendInvoiceButton({
  invoiceId,
  invoiceNumber,
  clientEmail,
  documents = [],
}: {
  invoiceId: string;
  invoiceNumber: string;
  clientEmail: string | null;
  documents?: { id: string; name: string; category: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [to, setTo] = useState(clientEmail ?? "");
  const [subject, setSubject] = useState(`Facture ${invoiceNumber}`);
  const [body, setBody] = useState("");
  const [docIds, setDocIds] = useState<string[]>([]);

  useEscapeClose(open, () => setOpen(false), !pending);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!to) {
      toast.error("Email destinataire requis");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body: body || undefined, documentIds: docIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Échec de l'envoi");
        return;
      }
      toast.success("Facture envoyée au client");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {/* <span> : capte le survol même quand le bouton est désactivé
          (un <button disabled> ne déclenche pas l'infobulle native). */}
      <span
        className="inline-block"
        title={clientEmail ? undefined : "Aucun email enregistré pour ce client"}
      >
        <Button
          variant="soft-success"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={!clientEmail}
          title={clientEmail ? "Envoyer cette facture par email au client" : undefined}
        >
          <Mail /> Envoyer par email
        </Button>
      </span>

      {open && createPortal(
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6 animate-fade-in"
          onMouseDown={backdropDismiss(() => !pending && setOpen(false))}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-lg p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold">
                  Envoyer la facture {invoiceNumber}
                </div>
                <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                  Le client recevra un email avec le lien vers la facture imprimable.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to">Email destinataire</Label>
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="client@exemple.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Objet</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">
                Message <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
              </Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Laissez vide pour utiliser le message par défaut"
                className="w-full px-3 py-2 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent resize-y"
              />
            </div>

            {documents.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  Joindre des documents{" "}
                  <span className="text-[var(--color-fg-mute)] font-normal">(du dossier lié)</span>
                </Label>
                <div className="max-h-44 overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border-2)] divide-y divide-[var(--color-border)]">
                  {documents.map((d) => {
                    const checked = docIds.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer hover:bg-[var(--color-surface-2)]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setDocIds((prev) =>
                              e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id),
                            )
                          }
                          className="size-4 accent-[var(--color-accent)]"
                        />
                        <span className="flex-1 truncate text-[var(--color-fg)]">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" disabled={pending}>
                {pending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}
