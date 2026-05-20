import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { storage } from "@/lib/storage";
import { canUploadDocument } from "@/lib/roles";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUploadDocument(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // tente de supprimer le fichier physique si présent
  if (doc.fileUrl) {
    try {
      // convention : url = `/api/files/<key>`
      const key = doc.fileUrl.startsWith("/api/files/")
        ? doc.fileUrl.slice("/api/files/".length)
        : null;
      if (key) {
        const driver = await storage();
        await driver.delete(key);
      }
    } catch (e) {
      // on ignore l'erreur de stockage pour ne pas bloquer la suppression DB
      console.warn("Erreur suppression fichier", e);
    }
  }

  await prisma.document.delete({ where: { id } });

  await audit({
    userId: session.user.id,
    action: "DELETE_DOCUMENT",
    entity: "Document",
    entityId: id,
    metadata: { name: doc.name, category: doc.category, dossierId: doc.dossierId },
  });

  return NextResponse.json({ ok: true });
}
