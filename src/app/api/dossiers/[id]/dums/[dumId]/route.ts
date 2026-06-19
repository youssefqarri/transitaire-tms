import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDUM } from "@/lib/roles";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  bureau: z.string().nullable().optional(),
  regime: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "ENREGISTRE", "VALIDE", "LIQUIDE", "CLOTURE"]).optional(),
  registeredAt: z.string().nullable().optional(),
  liquidatedAt: z.string().nullable().optional(),
  customsValue: z.number().nonnegative().nullable().optional(),
  estimatedDuties: z.number().nonnegative().nullable().optional(),
  liquidatedDuties: z.number().nonnegative().nullable().optional(),
  receiptNumber: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  articleCount: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// undefined => champ non transmis (on ne touche pas) ; null/"" => on efface.
const dateField = (v: string | null | undefined) =>
  v === undefined ? undefined : v ? new Date(v) : null;
const strField = (v: string | null | undefined) =>
  v === undefined ? undefined : v?.trim() || null;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; dumId: string }> },
) {
  const { id, dumId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canCreateDUM(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const d = parsed.data;

  const dum = await prisma.dUM.findFirst({ where: { id: dumId, dossierId: id } });
  if (!dum) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Marque automatiquement la date de liquidation si on passe en LIQUIDE (ou si on
  // saisit le montant liquidé) sans l'avoir renseignée.
  let liquidatedAt = dateField(d.liquidatedAt);
  const becomesLiquidated =
    (d.status === "LIQUIDE" || d.liquidatedDuties != null) && !dum.liquidatedAt;
  if (liquidatedAt === undefined && becomesLiquidated) liquidatedAt = new Date();

  const updated = await prisma.dUM.update({
    where: { id: dumId },
    data: {
      bureau: strField(d.bureau),
      regime: strField(d.regime),
      status: d.status,
      registeredAt: dateField(d.registeredAt),
      liquidatedAt,
      customsValue: d.customsValue === undefined ? undefined : d.customsValue,
      estimatedDuties: d.estimatedDuties === undefined ? undefined : d.estimatedDuties,
      liquidatedDuties: d.liquidatedDuties === undefined ? undefined : d.liquidatedDuties,
      receiptNumber: strField(d.receiptNumber),
      paidAt: dateField(d.paidAt),
      articleCount: d.articleCount === undefined ? undefined : d.articleCount,
      notes: strField(d.notes),
    },
  });

  await audit({
    userId: session.user.id,
    action: "UPDATE_DUM",
    entity: "DUM",
    entityId: dumId,
    metadata: {
      number: dum.number,
      dossierId: id,
      liquidatedDuties: d.liquidatedDuties,
      receiptNumber: d.receiptNumber,
    },
  });

  return NextResponse.json(updated);
}
