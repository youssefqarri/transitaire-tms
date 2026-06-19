import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDUM } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { MAX_DUMS_PER_DOSSIER } from "@/lib/reference";

const schema = z.object({
  number: z.string().min(1),
  bureau: z.string().optional(),
  regime: z.string().optional(),
  registeredAt: z.string().optional(), // date d'enregistrement (ISO yyyy-mm-dd)
  customsValue: z.number().nonnegative().nullable().optional(), // valeur en douane
  estimatedDuties: z.number().nonnegative().nullable().optional(), // droits estimés avant BADR
  articleCount: z.number().int().nonnegative().nullable().optional(), // nb d'articles de la DUM
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canCreateDUM(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // Un dossier peut cumuler plusieurs régimes douaniers, mais au maximum 2 DUM.
  const existing = await prisma.dUM.count({ where: { dossierId: id } });
  if (existing >= MAX_DUMS_PER_DOSSIER)
    return NextResponse.json(
      { error: `Maximum ${MAX_DUMS_PER_DOSSIER} DUM par dossier` },
      { status: 409 },
    );

  try {
    const dum = await prisma.dUM.create({
      data: {
        number: parsed.data.number.trim(),
        bureau: parsed.data.bureau?.trim() || null,
        regime: parsed.data.regime?.trim() || null,
        dossierId: id,
        status: "ENREGISTRE",
        registeredAt: parsed.data.registeredAt ? new Date(parsed.data.registeredAt) : new Date(),
        customsValue: parsed.data.customsValue ?? null,
        estimatedDuties: parsed.data.estimatedDuties ?? null,
        articleCount: parsed.data.articleCount ?? null,
      },
    });

    // si le dossier était en "DECLARATION_EN_COURS", passer à VALIDATION_DOUANE
    const dossier = await prisma.dossier.findUnique({ where: { id } });
    if (dossier && dossier.status === "DECLARATION_EN_COURS") {
      await prisma.dossier.update({
        where: { id },
        data: {
          status: "VALIDATION_DOUANE",
          statusChanges: {
            create: {
              fromStatus: "DECLARATION_EN_COURS",
              toStatus: "VALIDATION_DOUANE",
              changedById: session.user.id,
              note: `DUM ${dum.number} enregistrée`,
            },
          },
        },
      });
    }

    await audit({
      userId: session.user.id,
      action: "CREATE_DUM",
      entity: "DUM",
      entityId: dum.id,
      metadata: { number: dum.number, dossierId: id },
    });
    return NextResponse.json(dum);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Numéro DUM déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
