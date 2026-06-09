import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRegistry } from "@/lib/roles";
import { audit } from "@/lib/audit";

// DELETE /api/clients/[id]/contacts/[contactId] — retire un contact
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const { id, contactId } = await params;
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  });
  return NextResponse.json({ ok: true });
}
