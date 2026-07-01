"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SubscriptionManager, type ManagerPlan } from "./subscription-manager";

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

type Sub = {
  status: keyof typeof SUB_TONE;
  planId: string | null;
  planName: string | null;
  currentPeriodEnd: string | null;
  graceUntil: string | null;
  addons: string[];
} | null;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

// Échéance avec alerte : icône ⚠ à moins de 7 jours, rouge si dépassée.
function DueCell({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-[var(--color-fg-mute)]">—</span>;
  const end = new Date(iso);
  const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
  const label = end.toLocaleDateString("fr-FR");
  if (days < 0)
    return (
      <span className="inline-flex items-center gap-1 text-[var(--color-danger)] font-medium" title="Échéance dépassée">
        <AlertCircle className="size-3.5 shrink-0" /> {label}
      </span>
    );
  if (days <= 7)
    return (
      <span className="inline-flex items-center gap-1 text-[var(--color-warning)] font-medium" title={`Expire dans ${days} j`}>
        <AlertTriangle className="size-3.5 shrink-0" /> {label}
      </span>
    );
  return <span className="text-[var(--color-fg-3)]">{label}</span>;
}

export function OrgRow({
  org,
  plans,
}: {
  org: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    users: number;
    dossiers: number;
    subscription: Sub;
  };
  plans: ManagerPlan[];
}) {
  const router = useRouter();
  const sub = org.subscription;

  return (
    <tr
      onClick={() => router.push(`/admin/${org.id}`)}
      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
    >
      <td className="px-5 py-2.5 font-medium text-[var(--color-fg)]">
        {org.name}
        {!org.active && (
          <span className="ml-2 text-[11px] text-[var(--color-danger)]">(accès coupé)</span>
        )}
      </td>
      <td className="px-5 py-2.5 font-mono text-[var(--color-fg-3)]">{org.slug}</td>
      <td className="px-5 py-2.5 text-right tnum">{org.users}</td>
      <td className="px-5 py-2.5 text-right tnum">{org.dossiers}</td>
      <td className="px-5 py-2.5">
        {sub ? (
          <Badge tone={SUB_TONE[sub.status]} dot>
            {SUB_LABEL[sub.status]}
            {sub.planName ? ` · ${sub.planName}` : ""}
          </Badge>
        ) : (
          <span className="text-[var(--color-fg-mute)]">—</span>
        )}
      </td>
      <td className="px-5 py-2.5 tnum">
        <DueCell iso={sub?.currentPeriodEnd ?? null} />
      </td>
      {/* stopPropagation : le bouton Abonnement ne déclenche pas la navigation de ligne */}
      <td className="px-5 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
        <SubscriptionManager
          orgId={org.id}
          orgName={org.name}
          plans={plans}
          subscription={
            sub
              ? {
                  status: sub.status,
                  planId: sub.planId,
                  currentPeriodEnd: sub.currentPeriodEnd,
                  graceUntil: sub.graceUntil,
                  addons: sub.addons,
                }
              : null
          }
        />
      </td>
    </tr>
  );
}
