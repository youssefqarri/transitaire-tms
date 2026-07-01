"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Billing = {
  name: string | null;
  legalForm: string | null;
  address: string | null;
  city: string | null;
  ice: string | null;
  rc: string | null;
  taxId: string | null;
  patente: string | null;
  cnss: string | null;
  capital: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bank: string | null;
  rib: string | null;
  swift: string | null;
  invoicePrefix: string;
  invoiceFooter: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpFrom: string | null;
  hasSmtpPass: boolean;
};

const FIELDS: { key: keyof Billing; label: string; wide?: boolean }[] = [
  { key: "name", label: "Raison sociale *" },
  { key: "legalForm", label: "Forme juridique (SARL, SA…)" },
  { key: "address", label: "Adresse *", wide: true },
  { key: "city", label: "Ville" },
  { key: "ice", label: "ICE *" },
  { key: "rc", label: "RC" },
  { key: "taxId", label: "Identifiant fiscal (IF)" },
  { key: "patente", label: "Patente" },
  { key: "cnss", label: "CNSS" },
  { key: "capital", label: "Capital social" },
  { key: "phone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Site web" },
  { key: "invoicePrefix", label: "Préfixe de n° de facture (ex. ESC)" },
];

const BANK_FIELDS: { key: keyof Billing; label: string; wide?: boolean }[] = [
  { key: "bank", label: "Banque" },
  { key: "rib", label: "RIB" },
  { key: "swift", label: "SWIFT / BIC" },
];

export function PlatformBillingForm({ billing }: { billing: Billing }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      [...FIELDS, ...BANK_FIELDS, { key: "invoiceFooter" as const, label: "" }].map((x) => [
        x.key,
        (billing[x.key as keyof Billing] as string | null) ?? "",
      ]),
    ),
  );
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  // SMTP plateforme (états dédiés : booléen + mot de passe non prérempli).
  const [smtpHost, setSmtpHost] = useState(billing.smtpHost ?? "");
  const [smtpPort, setSmtpPort] = useState(billing.smtpPort ? String(billing.smtpPort) : "");
  const [smtpUser, setSmtpUser] = useState(billing.smtpUser ?? "");
  const [smtpFrom, setSmtpFrom] = useState(billing.smtpFrom ?? "");
  const [smtpSecure, setSmtpSecure] = useState(billing.smtpSecure);
  const [smtpPass, setSmtpPass] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/admin/platform-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          smtpHost,
          smtpUser,
          smtpFrom,
          smtpPort: smtpPort ? Number(smtpPort) : null,
          smtpSecure,
          ...(smtpPass ? { smtpPass } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Échec de l'enregistrement");
        return;
      }
      toast.success("Identité de facturation enregistrée");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <div className="text-[13px] font-semibold text-[var(--color-fg)]">Émetteur</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map((fld) => (
            <div key={fld.key} className={fld.wide ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
              <Label>{fld.label}</Label>
              <Input value={f[fld.key] ?? ""} onChange={(e) => set(fld.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <div className="text-[13px] font-semibold text-[var(--color-fg)]">Coordonnées bancaires (pour virement)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BANK_FIELDS.map((fld) => (
            <div key={fld.key} className="space-y-1.5">
              <Label>{fld.label}</Label>
              <Input value={f[fld.key] ?? ""} onChange={(e) => set(fld.key, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label>Mention de pied de facture (conditions de paiement…)</Label>
          <Input value={f.invoiceFooter ?? ""} onChange={(e) => set("invoiceFooter", e.target.value)} />
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <div>
          <div className="text-[13px] font-semibold text-[var(--color-fg)]">
            Email sortant (SMTP plateforme)
          </div>
          <p className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
            Les factures d'abonnement partent de cette adresse (ex. @escale.ma), indépendamment du SMTP
            des cabinets. Laissé vide, l'envoi retombe sur le SMTP courant.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Serveur SMTP (hôte)</Label>
            <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="mail.escale.ma" />
          </div>
          <div className="space-y-1.5">
            <Label>Port</Label>
            <Input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
          </div>
          <div className="space-y-1.5">
            <Label>Utilisateur</Label>
            <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="facturation@escale.ma" />
          </div>
          <div className="space-y-1.5">
            <Label>Mot de passe {billing.hasSmtpPass && <span className="text-[var(--color-fg-mute)]">(défini — laisser vide pour conserver)</span>}</Label>
            <Input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder={billing.hasSmtpPass ? "••••••••" : ""}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Adresse d'expédition (From)</Label>
            <Input
              value={smtpFrom}
              onChange={(e) => setSmtpFrom(e.target.value)}
              placeholder="Escale <facturation@escale.ma>"
            />
          </div>
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer md:col-span-2">
            <input
              type="checkbox"
              checked={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-[var(--color-fg)]">Connexion sécurisée (SSL/TLS — port 465)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
      </div>
    </form>
  );
}
