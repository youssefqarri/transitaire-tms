"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  code: string;
  ice: string;
  rc: string;
  taxId: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  contactName: string;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  code: "",
  ice: "",
  rc: "",
  taxId: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  contactName: "",
  notes: "",
};

export function ClientForm({
  mode = "create",
  clientId,
  initial,
}: {
  mode?: "create" | "edit";
  clientId?: string;
  initial?: Partial<FormState>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initial });

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("Nom requis");
      return;
    }
    start(async () => {
      const url = mode === "edit" ? `/api/clients/${clientId}` : "/api/clients";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(mode === "edit" ? "Client mis à jour" : "Client créé");
      router.push(mode === "edit" ? `/clients/${clientId}` : "/clients");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Code client</Label>
          <Input id="code" value={form.code} onChange={(e) => set("code", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ice">ICE</Label>
          <Input id="ice" value={form.ice} onChange={(e) => set("ice", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc">Registre commerce</Label>
          <Input id="rc" value={form.rc} onChange={(e) => set("rc", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="taxId">Identifiant fiscal</Label>
          <Input id="taxId" value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contact</Label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={(e) => set("contactName", e.target.value)}
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button disabled={pending}>
          {pending
            ? mode === "edit"
              ? "Enregistrement…"
              : "Création…"
            : mode === "edit"
            ? "Enregistrer"
            : "Créer le client"}
        </Button>
      </div>
    </form>
  );
}
