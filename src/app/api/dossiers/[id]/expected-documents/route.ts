import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
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
  category: z.enum(DOC_CATEGORIES),
  name: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const exp = await prisma.expectedDocument.create({
    data: {
      dossierId: id,
      category: parsed.data.category,
      name: parsed.data.name?.trim() || null,
      note: parsed.data.note?.trim() || null,
      requestedById: session.user.id,
    },
  });

  await audit({
    userId: session.user.id,
    action: "ADD_EXPECTED_DOC",
    entity: "ExpectedDocument",
    entityId: exp.id,
    metadata: { dossierId: id, category: parsed.data.category, name: parsed.data.name },
  });
  return NextResponse.json(exp);
}
