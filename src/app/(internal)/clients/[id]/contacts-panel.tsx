"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Contact = { id: string; name: string | null; email: string };

export function ContactsPanel({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email requis");
      return;
    }
    start(async () => {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Contact ajouté");
      setName("");
      setEmail("");
      setOpen(false);
      router.refresh();
    });
  }

  function remove(contactId: string) {
    start(async () => {
      const res = await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success("Contact retiré");
      router.refresh();
    });
  }

  return (
    <div className="px-5 py-4 border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-fg-3)]">
          Contacts (destinataires)
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-accent)] hover:underline"
        >
          <Plus className="size-3.5" strokeWidth={2} /> Ajouter
        </button>
      </div>

      {contacts.length === 0 && !open && (
        <div className="text-[13px] text-[var(--color-fg-3)]">
          Aucun contact secondaire. Le contact principal est l&apos;email du client.
        </div>
      )}

      {contacts.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-2 group">
              <Mail className="size-3.5 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
              <span className="text-[13px] text-[var(--color-fg)] min-w-0 flex-1 truncate">
                {c.name && <span className="font-medium">{c.name} • </span>}
                <span className="text-[var(--color-fg-2)] break-all">{c.email}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={pending}
                aria-label="Retirer"
                className="opacity-0 group-hover:opacity-100 text-[var(--color-fg-mute)] hover:text-[var(--color-danger)] transition"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form onSubmit={add} className="space-y-2 mt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom / libellé (ex. Service logistique)"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@client.ma"
          />
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
    </div>
  );
}
