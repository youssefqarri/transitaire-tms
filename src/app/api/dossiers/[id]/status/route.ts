import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({
  status: z.enum([
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
    "LIQUIDE",
    "BON_A_ENLEVER_RESERVE",
    "VALIDATION_MCA",
    "BON_A_ENLEVER_DEFINITIF",
    "CLOTURE",
    "ANNULE",
  ]),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canModifyDossier(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isClosing = parsed.data.status === "CLOTURE";
  const updated = await prisma.dossier.update({
    where: { id },
    data: {
      status: parsed.data.status,
      closedAt: isClosing ? new Date() : null,
      statusChanges: {
        create: {
          fromStatus: dossier.status,
          toStatus: parsed.data.status,
          note: parsed.data.note,
          changedById: session.user.id,
        },
      },
    },
  });

  // notification interne
  await prisma.notification.create({
    data: {
      role: "EXPLOITATION",
      dossierId: id,
      kind: "STATUS_CHANGE",
      title: `Dossier ${dossier.number} → ${parsed.data.status}`,
      body: parsed.data.note,
      link: `/dossiers/${id}`,
    },
  });

  await audit({
    userId: session.user.id,
    action: "UPDATE_STATUS",
    entity: "Dossier",
    entityId: id,
    metadata: { from: dossier.status, to: parsed.data.status, note: parsed.data.note },
  });

  return NextResponse.json(updated);
}
