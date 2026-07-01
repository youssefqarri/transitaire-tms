import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Folder, Building2, Receipt, HardDrive } from "lucide-react";
import type { ElementType } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { ROLE_LABELS, ROLE_TONE } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SubscriptionManager } from "../subscription-manager";
import { OverageButton } from "../overage-button";
import { InvoicePaymentButton } from "../invoice-row";
import { GenerateInvoiceButton } from "../generate-invoice-button";

export const dynamic = "force-dynamic";

const SUB_TONE = {
  TRIAL: "info",
  ACTIVE: "ok",
  PAST_DUE: "warn",
  SUSPENDED: "danger",
  CANCELLED: "neutral",
} as const;
const SUB_LABEL = {
  TRIAL: "Essai",
  ACTIVE: "Actif",
  PAST_DUE: "Impayé",
  SUSPENDED: "Suspendu",
  CANCELLED: "Résilié",
} as const;

const INV_TONE = {
  PENDING: "warn",
  PAID: "ok",
  OVERDUE: "danger",
  CANCELLED: "neutral",
} as const;
const INV_LABEL = {
  PENDING: "En attente",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
} as const;

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} Ko`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
}

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, dossiers: true, clients: true, invoices: true } },
      subscription: {
        include: { plan: true, invoices: { orderBy: { createdAt: "desc" } } },
      },
      users: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true, active: true },
      },
    },
  });
  if (!org) notFound();

  const plansRaw = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      priceYearly: true,
      maxSeats: true,
      maxDossiersPerMonth: true,
      maxStorageGb: true,
      includedAddons: true,
    },
  });
  // Decimal → number (sérialisable vers le composant client SubscriptionManager).
  const plans = plansRaw.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    priceYearly: p.priceYearly != null ? Number(p.priceYearly) : null,
    maxSeats: p.maxSeats,
    maxDossiersPerMonth: p.maxDossiersPerMonth,
    maxStorageGb: p.maxStorageGb,
    includedAddons: p.includedAddons,
  }));

  // Monitoring stockage S3 par cabinet : somme des tailles des pièces (documents +
  // pièces jointes d'emails), scopée à l'organisation.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [docAgg, mailAgg, dossiersThisMonth] = await Promise.all([
    prisma.document.aggregate({
      _sum: { fileSize: true },
      where: { deletedAt: null, dossier: { orgId: id } },
    }),
    prisma.emailAttachment.aggregate({
      _sum: { size: true },
      where: { message: { account: { orgId: id } } },
    }),
    prisma.dossier.count({ where: { orgId: id, createdAt: { gte: monthStart } } }),
  ]);
  const storageBytes = (docAgg._sum.fileSize ?? 0) + (mailAgg._sum.size ?? 0);
  const storageGb = storageBytes / 1024 ** 3;

  const sub = org.subscription;
  const plan = sub?.plan ?? null;
  const invoices = sub?.invoices ?? [];
  const quotaGb = plan?.maxStorageGb ?? null;
  const dossierQuota = plan?.maxDossiersPerMonth ?? null;
  const dossierOver = dossierQuota != null && dossiersThisMonth > dossierQuota;
  const storageOver = quotaGb != null && storageGb > quotaGb;
  const hasOverage = dossierOver || storageOver;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader
        title={org.name}
        subtitle={`${org.slug} · ${org.active ? "accès actif" : "accès coupé"}`}
        actions={
          <SubscriptionManager
            orgId={org.id}
            orgName={org.name}
            plans={plans}
            subscription={
              sub
                ? {
                    status: sub.status,
                    planId: sub.planId,
                    currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
                    graceUntil: sub.graceUntil ? sub.graceUntil.toISOString() : null,
                    addons: sub.addons,
                  }
                : null
            }
          />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={Users} label="Utilisateurs" value={org._count.users} />
        <Stat icon={Folder} label="Dossiers" value={org._count.dossiers} />
        <Stat icon={Building2} label="Clients" value={org._count.clients} />
        <Stat icon={Receipt} label="Factures" value={org._count.invoices} />
        <Stat
          icon={HardDrive}
          label="Stockage S3"
          value={fmtBytes(storageBytes)}
          hint={quotaGb ? `quota ${quotaGb} Go` : undefined}
        />
      </div>

      <Card>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold">Consommation vs quotas</div>
            {hasOverage && plan && <OverageButton orgId={org.id} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Usage label="Dossiers créés (ce mois)" value={dossiersThisMonth} quota={dossierQuota} over={dossierOver} />
            <Usage
              label="Stockage total (Go)"
              value={Number(storageGb.toFixed(2))}
              quota={quotaGb}
              over={storageOver}
            />
          </div>
          {!plan && (
            <p className="text-[12px] text-[var(--color-fg-mute)]">
              Aucun plan associé — associe un plan pour suivre les quotas et facturer les dépassements.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-5 space-y-2">
          <div className="text-[13px] font-semibold">Abonnement</div>
          {sub ? (
            <div className="flex flex-wrap items-center gap-4 text-[13px]">
              <Badge tone={SUB_TONE[sub.status]} dot>
                {SUB_LABEL[sub.status]}
              </Badge>
              <span className="text-[var(--color-fg-3)]">
                Plan : <span className="text-[var(--color-fg)]">{sub.plan?.name ?? "—"}</span>
              </span>
              <span className="text-[var(--color-fg-3)]">
                Échéance :{" "}
                <span className="text-[var(--color-fg)] tnum">
                  {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
                </span>
              </span>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--color-fg-mute)]">
              Aucun abonnement — clique « Abonnement » pour en définir un.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
          <div className="text-[13px] font-semibold">Factures d&apos;abonnement ({invoices.length})</div>
          {sub && <GenerateInvoiceButton orgId={org.id} />}
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-6 text-[13px] text-[var(--color-fg-mute)]">
            Aucune facture d&apos;abonnement émise.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)]">
                  <th className="px-5 py-2 text-left font-medium">N°</th>
                  <th className="px-5 py-2 text-left font-medium">Objet / période</th>
                  <th className="px-5 py-2 text-right font-medium">TTC</th>
                  <th className="px-5 py-2 text-right font-medium">Encaissé</th>
                  <th className="px-5 py-2 text-left font-medium">Échéance</th>
                  <th className="px-5 py-2 text-left font-medium">Statut</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const ht = Number(inv.amount);
                  const ttc = Math.round(ht * (1 + Number(inv.vatRate) / 100) * 100) / 100;
                  const paid = Number(inv.paidAmount);
                  const partial = inv.status === "PENDING" && paid > 0;
                  return (
                  <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2.5 font-medium text-[var(--color-fg)] tnum whitespace-nowrap">
                      {inv.number ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-fg-3)]">
                      {inv.label ?? `${formatDate(inv.periodStart)} – ${formatDate(inv.periodEnd)}`}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-[var(--color-fg)] tnum whitespace-nowrap">
                      {formatCurrency(ttc, "MAD")}
                    </td>
                    <td className="px-5 py-2.5 text-right tnum text-[var(--color-fg-3)] whitespace-nowrap">
                      {paid > 0 ? formatCurrency(paid, "MAD") : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-[var(--color-fg-3)] tnum whitespace-nowrap">
                      {formatDate(inv.dueAt)}
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge tone={partial ? "info" : INV_TONE[inv.status]} dot>
                        {partial ? "Partiel" : INV_LABEL[inv.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                        <InvoicePaymentButton invoiceId={inv.id} amount={ttc} paidAmount={paid} />
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-3 border-b border-[var(--color-border)] text-[13px] font-semibold">
          Comptes du cabinet ({org.users.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)]">
                <th className="px-5 py-2 text-left font-medium">Nom</th>
                <th className="px-5 py-2 text-left font-medium">Email</th>
                <th className="px-5 py-2 text-left font-medium">Rôle</th>
                <th className="px-5 py-2 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {org.users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-2.5 font-medium text-[var(--color-fg)]">{u.name}</td>
                  <td className="px-5 py-2.5 text-[var(--color-fg-3)]">{u.email}</td>
                  <td className="px-5 py-2.5">
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-5 py-2.5">
                    {u.active ? (
                      <Badge tone="ok" dot>
                        Actif
                      </Badge>
                    ) : (
                      <Badge tone="danger" dot>
                        Inactif
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Usage({
  label,
  value,
  quota,
  over,
}: {
  label: string;
  value: number;
  quota: number | null;
  over: boolean;
}) {
  const pct = quota != null && quota > 0 ? Math.min(100, Math.round((value / quota) * 100)) : null;
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[var(--color-fg-3)]">{label}</span>
        <span className={over ? "text-[var(--color-danger)] font-medium tnum" : "text-[var(--color-fg)] tnum"}>
          {value} <span className="text-[var(--color-fg-mute)]">/ {quota ?? "∞"}</span>
          {over && <span className="ml-1.5 text-[11px] font-normal">dépassement</span>}
        </span>
      </div>
      {pct != null && (
        <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-[var(--color-danger)]" : "bg-[var(--color-accent)]",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-3">
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-fg-3)]">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-[20px] font-semibold text-[var(--color-fg)] tnum">{value}</div>
      {hint && <div className="text-[11px] text-[var(--color-fg-mute)]">{hint}</div>}
    </div>
  );
}
