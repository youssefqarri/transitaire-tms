import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { audit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit({
    userId: session.user.id,
    action: "REVOKE_API_TOKEN",
    entity: "ApiToken",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
