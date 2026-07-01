import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, CalendarClock, Wallet, ReceiptText } from "lucide-react";
import type { ElementType } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

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
type SubStatus = keyof typeof SUB_TONE;
const SUB_ORDER: SubStatus[] = ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];

export default async function RevenusPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const [subs, invoices] = await Promise.all([
    prisma.subscription.findMany({
      include: { plan: { select: { name: true, price: true } } },
    }),
    prisma.subscriptionInvoice.findMany({
      select: { status: true, amount: true },
    }),
  ]);

  // MRR = Σ des prix mensuels HT des abonnements ACTIFS (avec plan).
  const mrr = subs.reduce((acc, s) => {
    if (s.status !== "ACTIVE" || !s.plan) return acc;
    return acc + Number(s.plan.price);
  }, 0);
  const arr = mrr * 12;

  // Répartition par statut.
  const byStatus = SUB_ORDER.map((status) => ({
    status,
    count: subs.filter((s) => s.status === status).length,
  }));

  // Répartition par plan.
  const planMap = new Map<string, number>();
  for (const s of subs) {
    const name = s.plan?.name ?? "Sans plan";
    planMap.set(name, (planMap.get(name) ?? 0) + 1);
  }
  const byPlan = [...planMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Factures d'abonnement : en attente vs payées.
  const pending = invoices.filter((i) => i.status === "PENDING");
  const paid = invoices.filter((i) => i.status === "PAID");
  const pendingTotal = pending.reduce((a, i) => a + Number(i.amount), 0);
  const paidTotal = paid.reduce((a, i) => a + Number(i.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader title="Revenus" subtitle="Suivi des abonnements et de la facturation plateforme" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={TrendingUp} label="MRR (HT)" value={formatCurrency(mrr, "MAD")} hint="revenu mensuel récurrent" />
        <Stat icon={CalendarClock} label="ARR (HT)" value={formatCurrency(arr, "MAD")} hint="MRR × 12" />
        <Stat
          icon={ReceiptText}
          label="Factures en attente"
          value={formatCurrency(pendingTotal, "MAD")}
          hint={`${pending.length} facture${pending.length > 1 ? "s" : ""}`}
        />
        <Stat
          icon={Wallet}
          label="Factures payées"
          value={formatCurrency(paidTotal, "MAD")}
          hint={`${paid.length} facture${paid.length > 1 ? "s" : ""}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-3 border-b border-[var(--color-border)] text-[13px] font-semibold">
            Cabinets par statut
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {byStatus.map((row) => (
                <tr key={row.status} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-2.5">
                    <Badge tone={SUB_TONE[row.status]} dot>
                      {SUB_LABEL[row.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium text-[var(--color-fg)] tnum">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="px-5 py-3 border-b border-[var(--color-border)] text-[13px] font-semibold">
            Cabinets par plan
          </div>
          {byPlan.length === 0 ? (
            <div className="px-5 py-6 text-[13px] text-[var(--color-fg-mute)]">Aucun abonnement.</div>
          ) : (
            <table className="w-full text-[13px]">
              <tbody>
                {byPlan.map((row) => (
                  <tr key={row.name} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2.5 text-[var(--color-fg)]">{row.name}</td>
                    <td className="px-5 py-2.5 text-right font-medium text-[var(--color-fg)] tnum">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
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
