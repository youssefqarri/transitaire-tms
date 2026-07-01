"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";

export function PlanForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState("MONTHLY");
  const [maxSeats, setMaxSeats] = useState("");
  const [maxDossiers, setMaxDossiers] = useState("");
  const [maxStorage, setMaxStorage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Nom et prix requis");
      return;
    }
    start(async () => {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          period,
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
      setPeriod("MONTHLY");
      setMaxSeats("");
      setMaxDossiers("");
      setMaxStorage("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
      <div className="space-y-1.5 md:col-span-2">
        <Label>Nom *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Essentiel, Pro…" />
      </div>
      <div className="space-y-1.5">
        <Label>Prix (MAD) *</Label>
        <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Période</Label>
        <Combobox
          items={[
            { id: "MONTHLY", label: "Mensuel" },
            { id: "YEARLY", label: "Annuel" },
          ]}
          value={period}
          onChange={setPeriod}
          searchable={false}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Sièges</Label>
        <Input type="number" min="1" value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} placeholder="∞" />
      </div>
      <div className="space-y-1.5">
        <Label>Dossiers/mois</Label>
        <Input
          type="number"
          min="1"
          value={maxDossiers}
          onChange={(e) => setMaxDossiers(e.target.value)}
          placeholder="∞"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Stockage (Go)</Label>
        <Input
          type="number"
          min="1"
          value={maxStorage}
          onChange={(e) => setMaxStorage(e.target.value)}
          placeholder="∞"
        />
      </div>
      <div className="md:col-span-6 flex justify-end">
        <Button disabled={pending}>{pending ? "…" : "Ajouter le plan"}</Button>
      </div>
    </form>
  );
}
