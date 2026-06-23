import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { statusRequiresDum } from "@/lib/statuses";
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
    "INSTANCE_FICHE_LIQUIDATION",
    "LIQUIDE",
    "BON_A_ENLEVER_RESERVE",
    "MAIN_LEVEE_RESERVE_CONFORMITE",
    "MAIN_LEVEE_RESERVE_DOCUMENTS",
    "VALIDATION_MCA",
    "BON_A_ENLEVER",
    "BON_A_ENLEVER_DEFINITIF",
    "EMBARQUEMENT",
    "SORTIE_MARCHANDISE",
    "LIVRAISON",
    "FACTURATION",
    "FACTURE",
    "CLOTURE",
    "ANNULE",
  ]),
  note: z.string().optional(),
  // voie concernée : douane (défaut) ou organismes de contrôle (statut parallèle)
  track: z.enum(["DOUANE", "CONTROLE"]).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const isComptable = role === "COMPTABILITE";
  if (!canModifyDossier(role) && !isComptable)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Comptable : seulement FACTURE ou CLOTURE
  if (isComptable && !["FACTURE", "CLOTURE"].includes(parsed.data.status)) {
    return NextResponse.json(
      { error: "Comptabilité : seuls les statuts Facturé et Clôturé sont autorisés" },
      { status: 403 },
    );
  }

  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ───── Voie « organismes de contrôle » : 2ᵉ statut parallèle, indépendant de la
  // douane (pas de précondition DUM, hors comptabilité). ─────
  if ((parsed.data.track ?? "DOUANE") === "CONTROLE") {
    if (isComptable)
      return NextResponse.json(
        { error: "La comptabilité ne gère pas la voie organismes de contrôle." },
        { status: 403 },
      );
    const updated = await prisma.dossier.update({
      where: { id },
      data: {
        secondaryStatus: parsed.data.status,
        statusChanges: {
          create: {
            fromStatus: dossier.secondaryStatus,
            toStatus: parsed.data.status,
            note: parsed.data.note,
            changedById: session.user.id,
            track: "CONTROLE",
          },
        },
      },
    });
    await prisma.notification.create({
      data: {
        role: "EXPLOITATION",
        dossierId: id,
        kind: "STATUS_CHANGE",
        title: `Dossier ${dossier.number} (organismes) → ${parsed.data.status}`,
        body: parsed.data.note,
        link: `/dossiers/${id}`,
      },
    });
    await audit({
      userId: session.user.id,
      action: "UPDATE_STATUS",
      entity: "Dossier",
      entityId: id,
      metadata: { track: "CONTROLE", to: parsed.data.status, note: parsed.data.note },
    });
    return NextResponse.json(updated);
  }

  // Précondition métier : pas de liquidation/BAE/mainlevée sans DUM enregistrée
  if (statusRequiresDum(parsed.data.status)) {
    const dumCount = await prisma.dUM.count({ where: { dossierId: id, status: { not: "DRAFT" } } });
    if (dumCount === 0)
      return NextResponse.json(
        { error: "Ce statut requiert au moins une DUM enregistrée sur le dossier." },
        { status: 422 },
      );
  }

  const isClosing = parsed.data.status === "CLOTURE";
  const isLiquidating = parsed.data.status === "LIQUIDE";
  const updated = await prisma.dossier.update({
    where: { id },
    data: {
      status: parsed.data.status,
      closedAt: isClosing ? new Date() : undefined,
      // horodate la liquidation des droits et taxes (première fois seulement)
      liquidationAt: isLiquidating && !dossier.liquidationAt ? new Date() : undefined,
      statusChanges: {
        create: {
          fromStatus: dossier.status,
          toStatus: parsed.data.status,
          note: parsed.data.note,
          changedById: session.user.id,
          track: "DOUANE",
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

  // Alerte dédiée à la liquidation : la cliente veut être avertie dès que la
  // douane a liquidé les droits et taxes (pour saisir la valeur en douane / quittance).
  if (isLiquidating) {
    await prisma.notification.create({
      data: {
        role: "EXPLOITATION",
        dossierId: id,
        kind: "SUIVI_LIQUIDATION",
        title: `Liquidation des droits — dossier ${dossier.number}`,
        body: "Les droits et taxes ont été liquidés. Renseignez la valeur en douane et la quittance, puis informez le client.",
        link: `/dossiers/${id}`,
      },
    });
  }

  await audit({
    userId: session.user.id,
    action: "UPDATE_STATUS",
    entity: "Dossier",
    entityId: id,
    metadata: { from: dossier.status, to: parsed.data.status, note: parsed.data.note },
  });

  return NextResponse.json(updated);
}
