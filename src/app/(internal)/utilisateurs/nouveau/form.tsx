"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/generated/prisma/enums";

export function UserForm({ clients }: { clients: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EXPLOITATION" as UserRole,
    clientId: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Champs requis manquants"); return; }
    if (form.password.length < 8) { toast.error("Mot de passe : 8 caractères min"); return; }
    if (form.role === "CLIENT" && !form.clientId) { toast.error("Client requis"); return; }
    start(async () => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        { toast.error(data.error || "Erreur"); return; }
      }
      toast.success("Utilisateur créé");
      router.push("/utilisateurs");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet *</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rôle *</Label>
          <Select id="role" value={form.role} onChange={(e) => set("role", e.target.value as UserRole)}>
            {Object.entries(ROLE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        {form.role === "CLIENT" && (
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="clientId">Client associé *</Label>
            <Combobox
              id="clientId"
              items={clients.map((c) => ({ id: c.id, label: c.label }))}
              value={form.clientId}
              onChange={(id) => set("clientId", id)}
              placeholder="Sélectionner un client…"
              searchPlaceholder="Rechercher un client…"
              emptyText="Aucun client trouvé"
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button disabled={pending}>{pending ? "Création…" : "Créer"}</Button>
      </div>
    </form>
  );
}
