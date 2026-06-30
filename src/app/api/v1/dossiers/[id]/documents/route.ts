import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, resolveDossierForCtx } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canUploadDocument } from "@/lib/roles";
import { DOCUMENT_CATEGORY_VALUES, isClientUploadableCategory } from "@/lib/statuses";
import type { DocumentCategory } from "@/generated/prisma/enums";

const schema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  notes: z.string().max(2000).optional(),
  // pas d'upload de fichier via JSON ; passer par /api/dossiers/[id]/documents (multipart) si besoin
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const category = parsed.data.category as DocumentCategory;

  // Accès objet : interne, ou CLIENT propriétaire du dossier (sinon 404 sans oracle)
  const dossier = await resolveDossierForCtx(ctx, id);
  if (!dossier) return NextResponse.json({ error: "Dossier not found" }, { status: 404 });
  // Isolation multi-tenant : le dossier doit appartenir à l'org du caller (no-op mono-tenant)
  if (ctx.orgId && dossier.orgId !== ctx.orgId)
    return NextResponse.json({ error: "Dossier not found" }, { status: 404 });

  // Droits d'écriture
  if (ctx.role !== "CLIENT" && !canUploadDocument(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ctx.role === "CLIENT" && !isClientUploadableCategory(category))
    return NextResponse.json({ error: "Catégorie non autorisée pour un client" }, { status: 403 });

  const previous = await prisma.document.findFirst({
    where: { dossierId: dossier.id, category, name: parsed.data.name },
    orderBy: { version: "desc" },
  });
  const version = previous ? previous.version + 1 : 1;

  const doc = await prisma.document.create({
    data: {
      dossierId: dossier.id,
      name: parsed.data.name,
      category,
      notes: parsed.data.notes,
      version,
      replacesId: previous?.id ?? null,
      uploadedById: ctx.userId,
    },
  });
  await audit({
    userId: ctx.userId,
    action: "UPLOAD_DOCUMENT",
    entity: "Document",
    entityId: doc.id,
    metadata: { dossierId: dossier.id, category: doc.category, via: ctx.via },
    orgId: ctx.orgId,
  });
  return NextResponse.json(doc);
}
