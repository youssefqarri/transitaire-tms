import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDUM } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({
  number: z.string().min(1),
  bureau: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canCreateDUM(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    const dum = await prisma.dUM.create({
      data: {
        number: parsed.data.number.trim(),
        bureau: parsed.data.bureau?.trim() || null,
        dossierId: id,
        status: "ENREGISTRE",
        registeredAt: new Date(),
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
