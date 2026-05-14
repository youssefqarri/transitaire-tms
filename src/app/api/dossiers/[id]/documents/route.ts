import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { storage } from "@/lib/storage";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "AUTRE");
  const file = form.get("file") as File | null;

  if (!name) return NextResponse.json({ error: "name requis" }, { status: 400 });

  let fileUrl: string | null = null;
  let fileKey: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const key = `${id}/${Date.now()}_${safeName}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { key: storedKey, url } = await storage().put(key, buf, {
      mime: file.type,
      filename: file.name,
    });
    fileKey = storedKey;
    fileUrl = url;
    fileSize = buf.length;
    mimeType = file.type;
  }

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
      fileUrl,
      fileSize,
      mimeType,
      version,
      replacesId: previous?.id ?? null,
      uploadedById: session.user.id,
    },
  });

  if (category === "BON_A_DELIVRER") {
    await prisma.dossier.update({
      where: { id },
      data: { bonADelivrerAt: new Date() },
    });
  }

  await audit({
    userId: session.user.id,
    action: "UPLOAD_DOCUMENT",
    entity: "Document",
    entityId: doc.id,
    metadata: { name, category, dossierId: id, fileKey },
  });

  return NextResponse.json(doc);
}
