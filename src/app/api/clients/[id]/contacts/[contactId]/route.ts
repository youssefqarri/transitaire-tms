import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRegistry } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { orgScope } from "@/lib/tenant";

// DELETE /api/clients/[id]/contacts/[contactId] — retire un contact
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const { id, contactId } = await params;
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Isolation multi-tenant : le client (parent) doit appartenir à l'org (no-op mono-tenant).
  const owned = await prisma.client.findFirst({
    where: { id, ...orgScope(session.user.orgId) },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ ok: true });

  // Scoping (anti-IDOR) + soft-delete : on masque le contact, on ne l'efface pas
  await prisma.clientContact
    .updateMany({ where: { id: contactId, clientId: id, deletedAt: null }, data: { deletedAt: new Date() } })
    .catch(() => {});
  await audit({
    userId: session.user.id,
    action: "DELETE_CLIENT_CONTACT",
    entity: "Client",
    entityId: id,
    metadata: { contactId },
    orgId: session.user.orgId,
  });
  return NextResponse.json({ ok: true });
}
