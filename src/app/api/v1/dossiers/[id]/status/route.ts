import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { statusRequiresDum, DOSSIER_STATUS_VALUES } from "@/lib/statuses";
import { audit } from "@/lib/audit";
import { orgScope, orgData } from "@/lib/tenant";

const schema = z.object({
  status: z.enum(DOSSIER_STATUS_VALUES),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModifyDossier(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const dossier = await prisma.dossier.findFirst({
    where: { ...orgScope(ctx.orgId), deletedAt: null, OR: [{ id }, { number: id }] },
  });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Précondition métier : pas de liquidation/BAE/mainlevée sans DUM enregistrée
  if (statusRequiresDum(parsed.data.status)) {
    const dumCount = await prisma.dUM.count({ where: { dossierId: dossier.id, status: { not: "DRAFT" } } });
    if (dumCount === 0)
      return NextResponse.json(
        { error: "Ce statut requiert au moins une DUM enregistrée sur le dossier." },
        { status: 422 },
      );
  }

  const isLiquidating = parsed.data.status === "LIQUIDE";
  const updated = await prisma.dossier.update({
    where: { id: dossier.id },
    data: {
      status: parsed.data.status,
      // closedAt posé à la clôture (1re fois conservée), effacé à la réouverture.
      closedAt: parsed.data.status === "CLOTURE" ? (dossier.closedAt ?? new Date()) : null,
      // horodate la liquidation des droits et taxes (première fois seulement)
      liquidationAt: isLiquidating && !dossier.liquidationAt ? new Date() : undefined,
      statusChanges: {
        create: {
          fromStatus: dossier.status,
          toStatus: parsed.data.status,
          note: parsed.data.note,
          changedById: ctx.userId,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      ...orgData(ctx.orgId),
      role: "EXPLOITATION",
      dossierId: dossier.id,
      kind: "STATUS_CHANGE",
      title: `Dossier ${dossier.number} → ${parsed.data.status}`,
      body: parsed.data.note,
      link: `/dossiers/${dossier.id}`,
    },
  });

  // Alerte dédiée à la liquidation des droits et taxes.
  if (isLiquidating) {
    await prisma.notification.create({
      data: {
        ...orgData(ctx.orgId),
        role: "EXPLOITATION",
        dossierId: dossier.id,
        kind: "SUIVI_LIQUIDATION",
        title: `Liquidation des droits — dossier ${dossier.number}`,
        body: "Les droits et taxes ont été liquidés. Renseignez la valeur en douane et la quittance, puis informez le client.",
        link: `/dossiers/${dossier.id}`,
      },
    });
  }

  await audit({
    userId: ctx.userId,
    action: "UPDATE_STATUS",
    entity: "Dossier",
    entityId: dossier.id,
    metadata: { from: dossier.status, to: parsed.data.status, via: ctx.via },
    orgId: ctx.orgId,
  });
  return NextResponse.json(updated);
}
