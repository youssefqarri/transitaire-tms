import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { UserForm } from "./form";

export default async function NewUserPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/utilisateurs" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Nouvel utilisateur</h1>
      <Card className="p-6">
        <UserForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </Card>
    </div>
  );
}
