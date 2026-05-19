import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  number: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  clientId: z.string().optional(),
  supplierId: z.string().nullable().optional(),
  goodsValue: z.number().nullable().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.number().nullable().optional(),
  goodsPackages: z.number().nullable().optional(),
  goodsPackagingUnit: z.enum(["COLIS", "PALETTES", "CONTENEURS"]).optional(),
  goodsDescription: z.string().nullable().optional(),
  controlOffice: z.string().nullable().optional(),
  hasVisit: z.boolean().optional(),
  hasConformityVisit: z.boolean().optional(),
  hasBureauValeur: z.boolean().optional(),
  visitDate: z.string().nullable().optional(),
  conformityVisitDate: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  // drapeaux parallèles
  billed: z.boolean().optional(),
  delivered: z.boolean().optional(),
  baeUnderPayment: z.boolean().optional(),
  baeUnderConformity: z.boolean().optional(),
  awaitingConformityValidation: z.boolean().optional(),
  customNote: z.string().nullable().optional(),
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

  try {
    const updated = await prisma.dossier.update({
      where: { id },
      data: {
        ...parsed.data,
        number: parsed.data.number?.trim() || undefined,
        visitDate:
          parsed.data.visitDate === undefined
            ? undefined
            : parsed.data.visitDate
            ? new Date(parsed.data.visitDate)
            : null,
        conformityVisitDate:
          parsed.data.conformityVisitDate === undefined
            ? undefined
            : parsed.data.conformityVisitDate
            ? new Date(parsed.data.conformityVisitDate)
            : null,
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
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Ce numéro de dossier existe déjà" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Erreur" }, { status: 500 });
  }
}
