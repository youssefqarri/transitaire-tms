"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Issuer } from "@/lib/invoicing";

const FIELDS: { key: keyof Issuer; label: string }[] = [
  { key: "name", label: "Raison sociale" },
  { key: "legalForm", label: "Forme juridique" },
  { key: "address", label: "Adresse" },
  { key: "ice", label: "ICE" },
  { key: "rc", label: "Registre de commerce (RC)" },
  { key: "taxId", label: "Identifiant fiscal (IF)" },
  { key: "patente", label: "Patente" },
  { key: "cnss", label: "CNSS" },
  { key: "agrement", label: "Agrément en douane" },
  { key: "phone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "bank", label: "Banque" },
  { key: "rib", label: "RIB" },
  { key: "swift", label: "SWIFT / BIC" },
];

export function IssuerSettingsForm({ initial }: { initial: Issuer }) {
  const router = useRouter();
  const [form, setForm] = useState<Issuer>(initial);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      issuerName: form.name,
      issuerLegalForm: form.legalForm,
      issuerAddress: form.address,
      issuerIce: form.ice,
      issuerRc: form.rc,
      issuerTaxId: form.taxId,
      issuerPatente: form.patente,
      issuerCnss: form.cnss,
      issuerAgrement: form.agrement,
      issuerPhone: form.phone,
      issuerEmail: form.email,
      issuerBank: form.bank,
      issuerRib: form.rib,
      issuerSwift: form.swift,
    };
    start(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'enregistrement");
        return;
      }
      toast.success("Coordonnées enregistrées");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </form>
  );
}
