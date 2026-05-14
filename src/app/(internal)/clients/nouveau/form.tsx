"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ClientForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
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
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Nom requis"); return; }
    start(async () => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Erreur"); return; }
      toast.success("Client créé");
      router.push("/clients");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code client</Label>
          <Input id="code" value={form.code} onChange={(e) => set("code", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ice">ICE</Label>
          <Input id="ice" value={form.ice} onChange={(e) => set("ice", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rc">Registre commerce</Label>
          <Input id="rc" value={form.rc} onChange={(e) => set("rc", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">Identifiant fiscal</Label>
          <Input id="taxId" value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact</Label>
          <Input id="contactName" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button disabled={pending}>{pending ? "Création…" : "Créer le client"}</Button>
      </div>
    </form>
  );
}
