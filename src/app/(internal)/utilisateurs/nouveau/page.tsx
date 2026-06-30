import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orgScope } from "@/lib/tenant";
import { canManageUsers } from "@/lib/roles";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { UserForm } from "./form";

export default async function NewUserPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const clients = await prisma.client.findMany({ where: { ...orgScope(session.user.orgId), deletedAt: null }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 animate-fade-in">
      <BackLink href="/utilisateurs">Retour</BackLink>
      <PageHeader title="Nouvel utilisateur" />
      <Card className="p-6">
        <UserForm
          clients={clients.map((c) => ({
            id: c.id,
            label: c.code ? `${c.name} (${c.code})` : c.name,
          }))}
        />
      </Card>
    </div>
  );
}
