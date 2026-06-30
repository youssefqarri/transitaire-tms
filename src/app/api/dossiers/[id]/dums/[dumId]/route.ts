import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDUM } from "@/lib/roles";
import { DUM_STATUS_VALUES } from "@/lib/statuses";
import { orgScope } from "@/lib/tenant";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  number: z.string().optional(),
  bureau: z.string().nullable().optional(),
  regime: z.string().nullable().optional(),
  status: z.enum(DUM_STATUS_VALUES).optional(),
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

  const dum = await prisma.dUM.findFirst({
    where: { id: dumId, dossierId: id, dossier: { ...orgScope(session.user.orgId) } },
  });
  if (!dum) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Numéro de DUM : modifiable uniquement en cas d'erreur, et seulement par
  // l'exploitation ou l'administrateur (pas le déclarant).
  const newNumber = d.number?.trim();
  const wantsNumberChange = !!newNumber && newNumber !== dum.number;
  if (wantsNumberChange && !["ADMIN", "EXPLOITATION"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Seuls l'exploitation et l'administrateur peuvent modifier le numéro de DUM." },
      { status: 403 },
    );
  }

  // Marque automatiquement la date de liquidation si on passe en LIQUIDE (ou si on
  // saisit le montant liquidé) sans l'avoir renseignée.
  let liquidatedAt = dateField(d.liquidatedAt);
  const becomesLiquidated =
    (d.status === "LIQUIDE" || d.liquidatedDuties != null) && !dum.liquidatedAt;
  if (liquidatedAt === undefined && becomesLiquidated) liquidatedAt = new Date();

  let updated;
  try {
    updated = await prisma.dUM.update({
    where: { id: dumId },
    data: {
      number: wantsNumberChange ? newNumber : undefined,
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
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002")
      return NextResponse.json({ error: "Ce numéro de DUM existe déjà." }, { status: 409 });
    throw e;
  }

  await audit({
    userId: session.user.id,
    action: "UPDATE_DUM",
    entity: "DUM",
    entityId: dumId,
    metadata: {
      dossierId: id,
      number: dum.number,
      ...(wantsNumberChange ? { newNumber } : {}),
      status: d.status,
      registeredAt: d.registeredAt,
      customsValue: d.customsValue,
      estimatedDuties: d.estimatedDuties,
      liquidatedDuties: d.liquidatedDuties,
      receiptNumber: d.receiptNumber,
      paidAt: d.paidAt,
      articleCount: d.articleCount,
    },
  });

  return NextResponse.json(updated);
}
