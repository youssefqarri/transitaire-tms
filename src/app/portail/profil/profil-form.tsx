"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, X, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";

type Props = {
  client: {
    name: string;
    code: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    contacts: { id: string; email: string }[];
  };
  account: { name: string; email: string };
};

export function ProfilForm({ client, account }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(client.whatsapp ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [savingCoords, startCoords] = useTransition();
  const [, startRefresh] = useTransition();
  const [busyEmail, setBusyEmail] = useState(false);

  async function saveCoords() {
    const res = await fetch("/api/portail/profil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, whatsapp }),
    });
    if (res.ok) {
      toast.success("Coordonnées enregistrées");
      startCoords(() => router.refresh());
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Échec de l'enregistrement");
    }
  }

  async function addEmail() {
    const v = newEmail.trim();
    if (!v) return;
    setBusyEmail(true);
    const res = await fetch("/api/portail/profil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: v }),
    });
    setBusyEmail(false);
    if (res.ok) {
      setNewEmail("");
      toast.success("Email ajouté");
      startRefresh(() => router.refresh());
    } else {
      toast.error("Email invalide");
    }
  }

  async function removeEmail(id: string) {
    const res = await fetch("/api/portail/profil", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) startRefresh(() => router.refresh());
    else toast.error("Échec de la suppression");
  }

  return (
    <div className="space-y-5">
      {/* Compte (lecture seule) */}
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <div className="px-5 py-4 flex items-center gap-3">
          <Avatar name={account.name} size={42} />
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-[var(--color-fg)] truncate">{client.name}</div>
            <div className="text-[12.5px] text-[var(--color-fg-3)] truncate">
              {account.email}
              {client.code && ` • ${client.code}`}
            </div>
          </div>
        </div>
      </Card>

      {/* Coordonnées principales */}
      <Card>
        <CardHeader>
          <CardTitle>Mes coordonnées</CardTitle>
        </CardHeader>
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-[var(--color-fg-mute)]" strokeWidth={1.75} /> Email principal
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.ma"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-[var(--color-fg-mute)]" strokeWidth={1.75} /> Téléphone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 12 34 56 78"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
                <WhatsAppIcon className="size-3.5 text-[var(--color-fg-mute)]" /> WhatsApp{" "}
                <span className="text-[var(--color-fg-mute)] font-normal">(si différent)</span>
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+212 6 12 34 56 78"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveCoords} loading={savingCoords}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Card>

      {/* Emails additionnels (carnet) */}
      <Card>
        <CardHeader>
          <CardTitle>Autres emails à notifier</CardTitle>
        </CardHeader>
        <div className="px-5 py-4 space-y-3">
          {client.contacts.length === 0 ? (
            <p className="text-[12.5px] text-[var(--color-fg-mute)]">
              Aucun email additionnel. Ajoutez-en pour que d&apos;autres personnes reçoivent les
              notifications.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {client.contacts.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[12.5px] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                >
                  {c.email}
                  <button
                    type="button"
                    onClick={() => removeEmail(c.id)}
                    aria-label={`Retirer ${c.email}`}
                    className="text-[var(--color-fg-mute)] hover:text-[var(--color-danger)]"
                  >
                    <X className="size-3.5" strokeWidth={2.25} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              placeholder="autre@adresse.ma"
            />
            <Button type="button" variant="outline" onClick={addEmail} loading={busyEmail}>
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
