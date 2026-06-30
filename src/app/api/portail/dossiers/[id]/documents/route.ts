import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { orgScope, orgData } from "@/lib/tenant";
import { storage } from "@/lib/storage";
import { validateUpload } from "@/lib/uploads";
import { isClientUploadableCategory } from "@/lib/statuses";
import type { DocumentCategory } from "@/generated/prisma/enums";

// Upload d'un document par le client via le portail (limité à ses propres dossiers).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT" || !session.user.clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orgId = session.user.orgId;

  // Vérifie que le dossier appartient bien au client connecté
  const dossier = await prisma.dossier.findFirst({
    where: { ...orgScope(orgId), deletedAt: null, id, clientId: session.user.clientId },
    select: { id: true, number: true, clientId: true },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const form = await req.formData();
  let name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "AUTRE");
  const notes = String(form.get("notes") ?? "").trim() || null;
  const file = form.get("file") as File | null;

  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  const check = validateUpload(file);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  // Le client ne peut déposer que des catégories autorisées (pas de documents internes/douane)
  if (!isClientUploadableCategory(category as DocumentCategory)) {
    return NextResponse.json({ error: "Catégorie de document non autorisée" }, { status: 400 });
  }

  if (!name) {
    name = file.name.replace(/\.[^.]+$/, "").trim() || `${category}_${new Date().toISOString().slice(0, 10)}`;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const key = `${id}/${Date.now()}_${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const driver = await storage();
  const { key: storedKey, url } = await driver.put(key, buf, {
    mime: file.type,
    filename: file.name,
  });

  const previous = await prisma.document.findFirst({
    where: { dossierId: id, category: category as never, name },
    orderBy: { version: "desc" },
  });
  const version = previous ? previous.version + 1 : 1;

  const doc = await prisma.document.create({
    data: {
      dossierId: id,
      name,
      category: category as never,
      notes,
      fileUrl: url,
      fileSize: buf.length,
      mimeType: file.type,
      version,
      replacesId: previous?.id ?? null,
      uploadedById: session.user.id,
    },
  });

  // Notification interne pour traitement (Admin + Exploitation + Déclarant + Bureau)
  const title = `Document client reçu — ${dossier.number}`;
  const body = `Le client a déposé : ${name}`;
  await prisma.notification.createMany({
    data: (["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU"] as const).map((role) => ({
      ...orgData(orgId),
      role,
      dossierId: id,
      kind: "CLIENT_DOC_UPLOAD",
      title,
      body,
      link: `/dossiers/${id}`,
    })),
  });

  await audit({
    userId: session.user.id,
    action: "CLIENT_UPLOAD_DOCUMENT",
    entity: "Document",
    entityId: doc.id,
    metadata: { name, category, dossierId: id, fileKey: storedKey },
    orgId,
  });

  return NextResponse.json(doc);
}
