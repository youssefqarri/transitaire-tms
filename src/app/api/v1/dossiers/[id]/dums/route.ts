import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { canCreateDUM } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({
  number: z.string().min(1),
  bureau: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canCreateDUM(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const dossier = await prisma.dossier.findFirst({ where: { OR: [{ id }, { number: id }] } });
  if (!dossier) return NextResponse.json({ error: "Dossier not found" }, { status: 404 });

  try {
    const dum = await prisma.dUM.create({
      data: {
        number: parsed.data.number.trim(),
        bureau: parsed.data.bureau?.trim() || null,
        dossierId: dossier.id,
        status: "ENREGISTRE",
        registeredAt: new Date(),
      },
    });
    await audit({
      userId: ctx.userId,
      action: "CREATE_DUM",
      entity: "DUM",
      entityId: dum.id,
      metadata: { number: dum.number, dossierId: dossier.id, via: ctx.via },
    });
    return NextResponse.json(dum);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Numéro DUM déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
