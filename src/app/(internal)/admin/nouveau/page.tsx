import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { PageHeader } from "@/components/ui/page-header";
import { NewOrgForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewOrgPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

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

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader title="Nouveau cabinet" subtitle="Crée l'organisation, son premier administrateur et son abonnement" />
      <NewOrgForm plans={plans} />
    </div>
  );
}
