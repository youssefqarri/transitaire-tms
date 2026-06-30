"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EMPTY = {
  name: "",
  slug: "",
  ice: "",
  rc: "",
  taxId: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export function NewOrgForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/admin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec de la création");
        return;
      }
      toast.success("Cabinet créé");
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-3">
        <div className="text-[13px] font-semibold text-[var(--color-fg)]">Cabinet</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom *">
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Slug *">
            <Input
              value={f.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              placeholder="cabinet-untel"
              required
            />
          </Field>
          <Field label="ICE">
            <Input value={f.ice} onChange={(e) => set("ice", e.target.value)} />
          </Field>
          <Field label="RC">
            <Input value={f.rc} onChange={(e) => set("rc", e.target.value)} />
          </Field>
          <Field label="Identifiant fiscal">
            <Input value={f.taxId} onChange={(e) => set("taxId", e.target.value)} />
          </Field>
          <Field label="Ville">
            <Input value={f.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Adresse">
            <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email du cabinet">
            <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <div className="text-[13px] font-semibold text-[var(--color-fg)]">Premier administrateur</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom *">
            <Input value={f.adminName} onChange={(e) => set("adminName", e.target.value)} required />
          </Field>
          <Field label="Email *">
            <Input
              type="email"
              value={f.adminEmail}
              onChange={(e) => set("adminEmail", e.target.value)}
              required
            />
          </Field>
          <Field label="Mot de passe * (8 caractères min.)">
            <Input
              type="password"
              value={f.adminPassword}
              onChange={(e) => set("adminPassword", e.target.value)}
              required
              minLength={8}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button disabled={pending}>{pending ? "Création…" : "Créer le cabinet"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
