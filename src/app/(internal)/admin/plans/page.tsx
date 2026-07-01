import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { PlanForm } from "./plan-form";
import { PlanActiveToggle } from "./plan-toggle";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("fr-FR");

export default async function PlansPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader title="Plans d'abonnement" subtitle="Offres proposées aux cabinets — tous les prix sont HT (hors taxe)" />

      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {plans.map((p, i) => {
            const monthly = Number(p.price);
            const yearly = p.priceYearly ? Number(p.priceYearly) : null;
            const pct = yearly && monthly > 0 ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0;
            const recommended = i === Math.floor((plans.length - 1) / 2);
            const features = [
              p.maxSeats ? `${p.maxSeats} sièges` : "Sièges illimités",
              p.maxDossiersPerMonth ? `${fmt(p.maxDossiersPerMonth)} dossiers / mois` : "Dossiers illimités",
              p.maxStorageGb ? `${p.maxStorageGb} Go de stockage` : "Stockage illimité",
              "Dossiers · DUM · documents",
              "Facturation · avoirs · export PDF",
              "Portail client",
              ...(i >= 1 ? ["Accès API (intégrations)", "Notifications WhatsApp"] : []),
              ...(i >= 2 ? ["Multi-bureau (à venir)", "Reporting avancé (à venir)", "Support dédié"] : []),
            ];
            return (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5",
                  recommended
                    ? "border-2 border-[var(--color-accent)] shadow-[0_10px_30px_-14px_rgba(0,0,0,0.18)]"
                    : "border border-[var(--color-border-2)]",
                  !p.active && "opacity-55",
                )}
              >
                {recommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--color-accent)] text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    Recommandé
                  </span>
                )}

                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--color-fg)]">{p.name}</h3>
                  <PlanActiveToggle planId={p.id} active={p.active} />
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-semibold text-[var(--color-fg)] tnum leading-none">
                      {fmt(monthly)}
                    </span>
                    <span className="text-[13px] text-[var(--color-fg-3)]">MAD / mois HT</span>
                  </div>
                  {yearly ? (
                    <div className="text-[12px] text-[var(--color-fg-3)] mt-1.5">
                      ou <span className="text-[var(--color-fg)] tnum">{fmt(yearly)}</span> MAD/an HT
                      {pct > 0 && (
                        <span className="ml-1.5 text-[var(--color-success)] font-medium">−{pct}%</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[12px] text-[var(--color-fg-mute)] mt-1.5">Tarif annuel non défini</div>
                  )}
                </div>

                <div className="my-4 border-t border-[var(--color-border)]" />

                <ul className="space-y-2 text-[13px] flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="size-4 text-[var(--color-success)] shrink-0 mt-0.5" strokeWidth={2.25} />
                      <span className="text-[var(--color-fg-2)]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-8 text-center text-[13px] text-[var(--color-fg-mute)]">
          Aucun plan — crée ta première offre ci-dessous.
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <div className="text-[13px] font-semibold text-[var(--color-fg)]">Ajouter un plan</div>
        <PlanForm />
      </div>
    </div>
  );
}
