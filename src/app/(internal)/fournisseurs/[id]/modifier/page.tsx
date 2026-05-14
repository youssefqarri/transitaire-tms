import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isInternal } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { SupplierForm } from "../../nouveau/form";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role)) redirect("/fournisseurs");

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href={`/fournisseurs/${id}`}
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Retour au fournisseur
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Modifier le fournisseur</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">{supplier.name}</p>
      </div>
      <Card>
        <div className="p-5">
          <SupplierForm
            mode="edit"
            supplierId={id}
            initial={{
              name: supplier.name,
              country: supplier.country ?? "",
              email: supplier.email ?? "",
              phone: supplier.phone ?? "",
              address: supplier.address ?? "",
              notes: supplier.notes ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
