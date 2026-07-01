"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PlanForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [maxSeats, setMaxSeats] = useState("");
  const [maxDossiers, setMaxDossiers] = useState("");
  const [maxStorage, setMaxStorage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Nom et prix mensuel requis");
      return;
    }
    start(async () => {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          priceYearly: priceYearly ? Number(priceYearly) : null,
          maxSeats: maxSeats ? Number(maxSeats) : null,
          maxDossiersPerMonth: maxDossiers ? Number(maxDossiers) : null,
          maxStorageGb: maxStorage ? Number(maxStorage) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Échec");
        return;
      }
      toast.success("Plan créé");
      setName("");
      setPrice("");
      setPriceYearly("");
      setMaxSeats("");
      setMaxDossiers("");
      setMaxStorage("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
      <Field className="md:col-span-2" label="Nom *">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Essentiel, Pro…" />
      </Field>
      <Field label="Prix mensuel (MAD HT) *">
        <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      <Field label="Prix annuel (MAD HT)">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={priceYearly}
          onChange={(e) => setPriceYearly(e.target.value)}
          placeholder="2 mois offerts"
        />
      </Field>
      <Field label="Sièges">
        <Input type="number" min="1" value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} placeholder="∞" />
      </Field>
      <Field label="Dossiers/mois">
        <Input
          type="number"
          min="1"
          value={maxDossiers}
          onChange={(e) => setMaxDossiers(e.target.value)}
          placeholder="∞"
        />
      </Field>
      <Field className="md:col-span-2" label="Stockage (Go)">
        <Input type="number" min="1" value={maxStorage} onChange={(e) => setMaxStorage(e.target.value)} placeholder="∞" />
      </Field>
      <div className="md:col-span-6 flex justify-end">
        <Button disabled={pending}>{pending ? "…" : "Ajouter le plan"}</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
