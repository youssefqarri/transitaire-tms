import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canModifyDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { orgScope, orgData } from "@/lib/tenant";

const patchSchema = z.object({
  number: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  clientReference: z.string().nullable().optional(),
  transportRegistration: z.string().nullable().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  supplierId: z.string().nullable().optional(),
  supplierName: z.string().optional(),
  transport: z.enum(["MARITIME", "AERIEN", "ROUTIER"]).nullable().optional(),
  goodsValue: z.number().nullable().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.number().nullable().optional(),
  goodsPackages: z.number().nullable().optional(),
  goodsPackagingUnit: z.enum(["COLIS", "PALETTES", "CONTENEURS", "REMORQUES"]).optional(),
  goodsDescription: z.string().nullable().optional(),
  controlOffice: z.string().nullable().optional(),
  controlOrganism: z.string().nullable().optional(),
  regulatoryServices: z.array(z.string()).optional(),
  hasVisit: z.boolean().optional(),
  hasConformityVisit: z.boolean().optional(),
  hasBureauValeur: z.boolean().optional(),
  visitDate: z.string().nullable().optional(),
  visitEffectiveDate: z.string().nullable().optional(),
  conformityVisitDate: z.string().nullable().optional(),
  conformityVisitEffectiveDate: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
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

  const orgId = session.user.orgId;
  // On ne modifie pas un dossier en corbeille (soft-delete).
  const dossier = await prisma.dossier.findFirst({ where: { id, deletedAt: null, ...orgScope(orgId) } });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Client et fournisseur saisis à la volée : on les retire de `patch` (ce ne sont
  // pas des champs Prisma) puis on les résout (retrouver, insensible à la casse, ou créer).
  const { supplierName, clientName, ...patch } = parsed.data;

  let clientIdResolved = patch.clientId?.trim() || undefined;
  if (!clientIdResolved && clientName?.trim()) {
    const name = clientName.trim();
    const existing = await prisma.client.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null, ...orgScope(orgId) },
    });
    clientIdResolved = existing ? existing.id : (await prisma.client.create({ data: { name, ...orgData(orgId) } })).id;
  }

  // règle: client modifiable uniquement avant validation de DUM
  if (clientIdResolved && clientIdResolved !== dossier.clientId) {
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

  let supplierIdResolved = patch.supplierId;
  if (supplierName?.trim() && !patch.supplierId) {
    const name = supplierName.trim();
    const existing = await prisma.supplier.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, ...orgScope(orgId) },
    });
    supplierIdResolved = existing ? existing.id : (await prisma.supplier.create({ data: { name, ...orgData(orgId) } })).id;
  }

  try {
    const updated = await prisma.dossier.update({
      where: { id },
      data: {
        ...patch,
        clientId: clientIdResolved,
        supplierId: supplierIdResolved,
        number: parsed.data.number?.trim() || undefined,
        visitDate:
          parsed.data.visitDate === undefined
            ? undefined
            : parsed.data.visitDate
            ? new Date(parsed.data.visitDate)
            : null,
        visitEffectiveDate:
          parsed.data.visitEffectiveDate === undefined
            ? undefined
            : parsed.data.visitEffectiveDate
            ? new Date(parsed.data.visitEffectiveDate)
            : null,
        conformityVisitDate:
          parsed.data.conformityVisitDate === undefined
            ? undefined
            : parsed.data.conformityVisitDate
            ? new Date(parsed.data.conformityVisitDate)
            : null,
        conformityVisitEffectiveDate:
          parsed.data.conformityVisitEffectiveDate === undefined
            ? undefined
            : parsed.data.conformityVisitEffectiveDate
            ? new Date(parsed.data.conformityVisitEffectiveDate)
            : null,
        deliveredAt:
          parsed.data.deliveredAt === undefined
            ? undefined
            : parsed.data.deliveredAt
            ? new Date(parsed.data.deliveredAt)
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // seul un ADMIN peut supprimer un dossier
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Seul un admin peut supprimer un dossier" }, { status: 403 });

  const dossier = await prisma.dossier.findFirst({
    where: { id, ...orgScope(session.user.orgId) },
    select: { id: true, number: true, clientId: true, deletedAt: true },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  if (dossier.deletedAt) return NextResponse.json({ ok: true }); // déjà supprimé

  // Soft-delete : on conserve les pièces à valeur légale (DUM, documents douaniers) ;
  // le dossier disparaît des listes mais reste restaurable. (Pas de DELETE cascade.)
  await prisma.dossier.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({
    userId: session.user.id,
    action: "SOFT_DELETE_DOSSIER",
    entity: "Dossier",
    entityId: id,
    metadata: { number: dossier.number, clientId: dossier.clientId },
  });
  return NextResponse.json({ ok: true });
}
