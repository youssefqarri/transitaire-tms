import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { ClientForm } from "../../nouveau/form";
import { isInternal } from "@/lib/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role)) redirect("/clients");

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Retour au client
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Modifier le client</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          {client.name}
        </p>
      </div>
      <Card>
        <div className="p-5">
          <ClientForm
            mode="edit"
            clientId={id}
            initial={{
              name: client.name,
              code: client.code ?? "",
              ice: client.ice ?? "",
              rc: client.rc ?? "",
              taxId: client.taxId ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              city: client.city ?? "",
              address: client.address ?? "",
              contactName: client.contactName ?? "",
              notes: client.notes ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
