import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { nextProvisionalDossierNumber } from "@/lib/dossier-numbering";
import { orgScope, orgData } from "@/lib/tenant";

const createSchema = z.object({
  number: z.string().optional(),
  reference: z.string().optional(),
  clientReference: z.string().optional(),
  transportRegistration: z.string().optional(),
  type: z.enum(["IMPORT", "EXPORT"]),
  paymentMode: z.enum(["WITH_PAYMENT", "WITHOUT_PAYMENT"]),
  transport: z.enum(["MARITIME", "AERIEN", "ROUTIER"]).or(z.literal("")).optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  goodsValue: z.string().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.string().optional(),
  goodsPackages: z.string().optional(),
  goodsPackagingUnit: z.enum(["COLIS", "PALETTES", "CONTENEURS", "REMORQUES"]).optional(),
  goodsDescription: z.string().optional(),
  controlOrganism: z.string().optional(),
  regulatoryServices: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canCreateDossier(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const orgId = session.user.orgId;

  // Client : si un nom est saisi sans id (nouveau client à la création), on le
  // retrouve (insensible à la casse) ou on le crée, puis on rattache le dossier.
  let clientId = data.clientId?.trim() || null;
  if (!clientId && data.clientName?.trim()) {
    const name = data.clientName.trim();
    const existing = await prisma.client.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null, ...orgScope(orgId) },
    });
    clientId = existing ? existing.id : (await prisma.client.create({ data: { name, ...orgData(orgId) } })).id;
  }
  if (!clientId) return NextResponse.json({ error: "Client requis" }, { status: 400 });

  // Fournisseur : si un nom est saisi sans id (nouveau fournisseur), on le retrouve
  // (insensible à la casse) ou on le crée, puis on rattache le dossier.
  let supplierId = data.supplierId?.trim() || null;
  if (!supplierId && data.supplierName?.trim()) {
    const name = data.supplierName.trim();
    const existing = await prisma.supplier.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, ...orgScope(orgId) },
    });
    supplierId = existing ? existing.id : (await prisma.supplier.create({ data: { name, ...orgData(orgId) } })).id;
  }

  // Numéro : utiliser celui fourni OU générer un provisoire PROV-YYYY-NNNN
  const providedNumber = data.number?.trim();
  let number = providedNumber || (await nextProvisionalDossierNumber(undefined, orgId));

  try {
    // Boucle de retry au cas où le PROV-XXXX entrerait en collision (rare)
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const dossier = await prisma.dossier.create({
          data: {
            ...orgData(orgId),
            number,
            reference: data.reference?.trim() || null,
            clientReference: data.clientReference?.trim() || null,
            transportRegistration: data.transportRegistration?.trim() || null,
            type: data.type,
            paymentMode: data.paymentMode,
            transport: data.transport || null,
            clientId,
            supplierId,
            goodsValue: data.goodsValue ? Number(data.goodsValue) : null,
            goodsCurrency: data.goodsCurrency || "EUR",
            goodsWeight: data.goodsWeight ? Number(data.goodsWeight) : null,
            goodsPackages: data.goodsPackages ? Number(data.goodsPackages) : null,
            goodsPackagingUnit: data.goodsPackagingUnit ?? "COLIS",
            goodsDescription: data.goodsDescription || null,
            controlOrganism: data.controlOrganism || null,
            regulatoryServices: data.regulatoryServices ?? [],
            createdById: session.user.id,
            receivedAt: new Date(),
            status: "RECEPTIONNE",
            statusChanges: {
              create: {
                toStatus: "RECEPTIONNE",
                changedById: session.user.id,
                note: "Création du dossier",
              },
            },
          },
        });
        await audit({
          userId: session.user.id,
          action: "CREATE_DOSSIER",
          entity: "Dossier",
          entityId: dossier.id,
          metadata: { number: dossier.number, auto: !providedNumber },
        });
        return NextResponse.json({ id: dossier.id, number: dossier.number });
      } catch (e: unknown) {
        const err = e as { code?: string };
        // Conflit numéro : si auto-généré on retente avec un nouveau
        if (err.code === "P2002" && !providedNumber) {
          number = await nextProvisionalDossierNumber();
          continue;
        }
        if (err.code === "P2002") {
          return NextResponse.json({ error: "Ce numéro de dossier existe déjà" }, { status: 409 });
        }
        throw e;
      }
    }
    return NextResponse.json(
      { error: "Impossible d'attribuer un numéro (réessayer)" },
      { status: 500 },
    );
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({ error: err.message || "Erreur" }, { status: 500 });
  }
}
