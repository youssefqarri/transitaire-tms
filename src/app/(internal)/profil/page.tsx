import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLE_TONE } from "@/lib/roles";
import { ChangePasswordForm } from "./change-password-form";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { client: { select: { name: true } } },
  });
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Mon profil</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Informations personnelles et sécurité du compte.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <div className="px-5 py-4 flex items-center gap-4">
          <Avatar name={user.name} size={48} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium">{user.name}</div>
            <div className="text-[13px] text-[var(--color-fg-3)]">{user.email}</div>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
              {user.client && <Badge tone="outline">{user.client.name}</Badge>}
            </div>
          </div>
          <div className="text-right text-[12px] text-[var(--color-fg-mute)]">
            Membre depuis {formatDate(user.createdAt)}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer mon mot de passe</CardTitle>
        </CardHeader>
        <div className="p-5">
          <ChangePasswordForm />
        </div>
      </Card>
    </div>
  );
}
