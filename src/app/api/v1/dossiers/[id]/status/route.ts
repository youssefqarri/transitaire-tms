import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";

const DOSSIER_STATUSES = [
  "OUVERTURE",
  "RECEPTIONNE",
  "DOCUMENTS_MANQUANTS",
  "DOCUMENTS_RECUS",
  "BON_A_DELIVRER_RECU",
  "DECLARATION_EN_COURS",
  "VALIDATION_DOUANE",
  "VISITE",
  "CONFORME",
  "BUREAU_VALEUR",
  "DEMANDE_DOCUMENTS",
  "INSTANCE_FICHE_LIQUIDATION",
  "LIQUIDE",
  "BON_A_ENLEVER_RESERVE",
  "MAIN_LEVEE_RESERVE_CONFORMITE",
  "VALIDATION_MCA",
  "BON_A_ENLEVER",
  "BON_A_ENLEVER_DEFINITIF",
  "LIVRAISON",
  "FACTURATION",
  "CLOTURE",
  "ANNULE",
] as const;

const schema = z.object({
  status: z.enum(DOSSIER_STATUSES),
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
    where: { OR: [{ id }, { number: id }] },
  });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.dossier.update({
    where: { id: dossier.id },
    data: {
      status: parsed.data.status,
      closedAt: parsed.data.status === "CLOTURE" ? new Date() : null,
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
      role: "EXPLOITATION",
      dossierId: dossier.id,
      kind: "STATUS_CHANGE",
      title: `Dossier ${dossier.number} → ${parsed.data.status}`,
      body: parsed.data.note,
      link: `/dossiers/${dossier.id}`,
    },
  });

  await audit({
    userId: ctx.userId,
    action: "UPDATE_STATUS",
    entity: "Dossier",
    entityId: dossier.id,
    metadata: { from: dossier.status, to: parsed.data.status, via: ctx.via },
  });
  return NextResponse.json(updated);
}
