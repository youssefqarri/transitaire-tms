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
  country: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const EMPTY: FormState = { name: "", country: "", email: "", phone: "", address: "", notes: "" };

export function SupplierForm({
  mode = "create",
  supplierId,
  initial,
}: {
  mode?: "create" | "edit";
  supplierId?: string;
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
      const url = mode === "edit" ? `/api/suppliers/${supplierId}` : "/api/suppliers";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success(mode === "edit" ? "Fournisseur mis à jour" : "Fournisseur créé");
      router.push(mode === "edit" ? `/fournisseurs/${supplierId}` : "/fournisseurs");
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
          <Label htmlFor="country">Pays</Label>
          <Input id="country" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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
            : "Créer"}
        </Button>
      </div>
    </form>
  );
}
