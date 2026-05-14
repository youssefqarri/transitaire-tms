import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

const DOC_CATEGORIES = [
  "FACTURE_COMMERCIALE",
  "COLISAGE",
  "FACTURE_FRET",
  "CONNAISSEMENT",
  "ENGAGEMENT_IMPORTATION",
  "BON_A_DELIVRER",
  "CERTIFICAT_ORIGINE",
  "ASSURANCE",
  "LICENCE",
  "CERTIFICAT_SANITAIRE",
  "CERTIFICAT_CONFORMITE",
  "FICHE_LIQUIDATION",
  "TICKET_PAIEMENT",
  "BON_A_ENLEVER",
  "AUTRE",
] as const;

const schema = z.object({
  name: z.string().min(1),
  category: z.enum(DOC_CATEGORIES),
  notes: z.string().optional(),
  // pas d'upload de fichier via JSON pour Claude — passer par /api/dossiers/[id]/documents (multipart) si besoin
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const dossier = await prisma.dossier.findFirst({ where: { OR: [{ id }, { number: id }] } });
  if (!dossier) return NextResponse.json({ error: "Dossier not found" }, { status: 404 });

  const previous = await prisma.document.findFirst({
    where: { dossierId: dossier.id, category: parsed.data.category, name: parsed.data.name },
    orderBy: { version: "desc" },
  });
  const version = previous ? previous.version + 1 : 1;

  const doc = await prisma.document.create({
    data: {
      dossierId: dossier.id,
      name: parsed.data.name,
      category: parsed.data.category,
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
  });
  return NextResponse.json(doc);
}
