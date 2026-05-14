import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  reference: z.string().nullable().optional(),
  clientId: z.string().optional(),
  supplierId: z.string().nullable().optional(),
  goodsValue: z.number().nullable().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.number().nullable().optional(),
  goodsPackages: z.number().nullable().optional(),
  goodsDescription: z.string().nullable().optional(),
  controlOffice: z.string().nullable().optional(),
  hasVisit: z.boolean().optional(),
  hasBureauValeur: z.boolean().optional(),
  visitDate: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModifyDossier(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // règle: client modifiable uniquement avant validation de DUM
  if (parsed.data.clientId && parsed.data.clientId !== dossier.clientId) {
    const hasValidatedDUM = await prisma.dUM.count({
      where: { dossierId: id, status: { in: ["VALIDE", "LIQUIDE", "CLOTURE"] } },
    });
    if (hasValidatedDUM > 0) {
      return NextResponse.json(
        { error: "Le client ne peut plus être modifié : une DUM est déjà validée." },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.dossier.update({
    where: { id },
    data: {
      ...parsed.data,
      visitDate: parsed.data.visitDate ? new Date(parsed.data.visitDate) : parsed.data.visitDate,
    },
  });

  await audit({
    userId: session.user.id,
    action: "UPDATE_DOSSIER",
    entity: "Dossier",
    entityId: id,
    metadata: parsed.data,
  });

  return NextResponse.json(updated);
}
