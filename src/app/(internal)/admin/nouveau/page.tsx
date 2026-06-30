import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { PageHeader } from "@/components/ui/page-header";
import { NewOrgForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewOrgPage() {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email)) redirect("/dashboard");

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" /> Retour aux cabinets
      </Link>
      <PageHeader title="Nouveau cabinet" subtitle="Crée l'organisation et son premier administrateur" />
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <NewOrgForm />
      </div>
    </div>
  );
}
