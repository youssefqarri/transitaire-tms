import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfilForm } from "./profil-form";

export const dynamic = "force-dynamic";

export default async function PortailProfilPage() {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT" || !session.user.clientId) redirect("/portail");

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      whatsapp: true,
      contacts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true },
      },
    },
  });
  if (!client) redirect("/portail");

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-fg)]">Mon profil</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
          Vos coordonnées servent à vous tenir informé de l&apos;avancement de vos dossiers
          (email et WhatsApp).
        </p>
      </div>
      <ProfilForm
        client={client}
        account={{ name: session.user.name, email: session.user.email }}
      />
    </div>
  );
}
