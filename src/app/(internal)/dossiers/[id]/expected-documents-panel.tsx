"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Check, X, AlertCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
import type { DocumentCategory } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/utils";
import { NotifyClientButton } from "./notify-button";

type Contact = { id: string; name: string | null; email: string };

type Expected = {
  id: string;
  category: DocumentCategory;
  name: string | null;
  note: string | null;
  fulfilledAt: Date | null;
  requestedByName: string | null;
  createdAt: Date;
};

export function ExpectedDocumentsPanel({
  dossierId,
  expected,
  readOnly = false,
  clientId,
  clientEmail,
  clientPhone,
  contacts,
  dossierContactEmail,
  waConfigured,
}: {
  dossierId: string;
  expected: Expected[];
  readOnly?: boolean;
  clientId: string;
  clientEmail: string | null;
  clientPhone: string | null;
  contacts: Contact[];
  dossierContactEmail: string | null;
  waConfigured: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [category, setCategory] = useState<DocumentCategory>("AUTRE");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/expected-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name: name || undefined, note: note || undefined }),
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success("Document ajouté à la liste");
      setName("");
      setNote("");
      setOpen(false);
      router.refresh();
    });
  }

  function markFulfilled(id: string, fulfilled: boolean) {
    start(async () => {
      const res = await fetch(`/api/expected-documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfilled }),
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Retirer ce document de la liste ?")) return;
    start(async () => {
      const res = await fetch(`/api/expected-documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      router.refresh();
    });
  }

  const pendingCount = expected.filter((e) => !e.fulfilledAt).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Documents demandés au client
          {pendingCount > 0 && (
            <Badge tone="warn" className="ml-2">
              {pendingCount} en attente
            </Badge>
          )}
        </CardTitle>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <NotifyClientButton
                dossierId={dossierId}
                clientId={clientId}
                clientEmail={clientEmail}
                clientPhone={clientPhone}
                contacts={contacts}
                dossierContactEmail={dossierContactEmail}
                waConfigured={waConfigured}
                label="Envoyer au client"
              />
            )}
            <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
              <Plus /> Demander
            </Button>
          </div>
        )}
      </CardHeader>

      {!readOnly && open && (
        <form
          onSubmit={submit}
          className="px-5 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] space-y-3 animate-fade-in"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat">Type de document</Label>
              <Combobox
                id="cat"
                items={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, l]) => ({
                  id: k,
                  label: l,
                }))}
                value={category}
                onChange={(v) => setCategory(v as DocumentCategory)}
                placeholder="Choisir un type…"
                searchPlaceholder="Rechercher…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom / précision (optionnel)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Certificat halal, Licence import…"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. À demander en priorité, le client doit l'obtenir auprès de…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-[var(--color-border)]">
        {expected.length === 0 && (
          <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucun document supplémentaire demandé. Les documents obligatoires standards sont
            détectés automatiquement (voir panel Documents).
          </div>
        )}
        {expected.map((e) => (
          <div
            key={e.id}
            className={`px-5 py-3 flex items-start gap-3 ${e.fulfilledAt ? "opacity-50" : ""}`}
          >
            <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--color-surface-2)]">
              {e.fulfilledAt ? (
                <Check className="size-3.5 text-[var(--color-success)]" strokeWidth={2.5} />
              ) : (
                <Clock className="size-3.5 text-[var(--color-warning)]" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium">
                  {DOCUMENT_CATEGORY_LABELS[e.category]}
                  {e.name && (
                    <span className="text-[var(--color-fg-3)] font-normal"> • {e.name}</span>
                  )}
                </span>
                {e.fulfilledAt && (
                  <Badge tone="ok">Reçu le {formatDate(e.fulfilledAt)}</Badge>
                )}
              </div>
              {e.note && (
                <div className="text-[12px] text-[var(--color-fg-3)] mt-1 italic">
                  {e.note}
                </div>
              )}
              <div className="text-[11px] text-[var(--color-fg-mute)] mt-1">
                Demandé{" "}
                {e.requestedByName && <span>par {e.requestedByName} </span>}
                • {formatDate(e.createdAt)}
              </div>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-1 shrink-0">
                {!e.fulfilledAt ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markFulfilled(e.id, true)}
                    disabled={pending}
                    title="Marquer comme reçu"
                  >
                    <Check />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markFulfilled(e.id, false)}
                    disabled={pending}
                    title="Annuler la réception"
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(e.id)}
                  disabled={pending}
                  title="Retirer"
                >
                  <X className="text-[var(--color-fg-mute)]" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
