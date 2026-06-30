import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canUploadDocument } from "@/lib/roles";
import { orgScope } from "@/lib/tenant";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUploadDocument(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = await prisma.document.findFirst({
    where: { id, dossier: { ...orgScope(session.user.orgId) } },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  if (doc.deletedAt) return NextResponse.json({ ok: true });

  // Soft-delete : on CONSERVE la pièce et son fichier (valeur légale), on la masque.
  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });

  await audit({
    userId: session.user.id,
    action: "SOFT_DELETE_DOCUMENT",
    entity: "Document",
    entityId: id,
    metadata: { name: doc.name, category: doc.category, dossierId: doc.dossierId },
  });

  return NextResponse.json({ ok: true });
}
