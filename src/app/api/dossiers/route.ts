import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { nextProvisionalDossierNumber } from "@/lib/dossier-numbering";

const createSchema = z.object({
  number: z.string().optional(),
  reference: z.string().optional(),
  type: z.enum(["IMPORT", "EXPORT"]),
  paymentMode: z.enum(["WITH_PAYMENT", "WITHOUT_PAYMENT"]),
  clientId: z.string().min(1),
  supplierId: z.string().optional(),
  goodsValue: z.string().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.string().optional(),
  goodsPackages: z.string().optional(),
  goodsPackagingUnit: z.enum(["COLIS", "PALETTES", "CONTENEURS"]).optional(),
  goodsDescription: z.string().optional(),
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

  // Numéro : utiliser celui fourni OU générer un provisoire PROV-YYYY-NNNN
  const providedNumber = data.number?.trim();
  let number = providedNumber || (await nextProvisionalDossierNumber());

  try {
    // Boucle de retry au cas où le PROV-XXXX entrerait en collision (rare)
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const dossier = await prisma.dossier.create({
          data: {
            number,
            reference: data.reference?.trim() || null,
            type: data.type,
            paymentMode: data.paymentMode,
            clientId: data.clientId,
            supplierId: data.supplierId || null,
            goodsValue: data.goodsValue ? Number(data.goodsValue) : null,
            goodsCurrency: data.goodsCurrency || "EUR",
            goodsWeight: data.goodsWeight ? Number(data.goodsWeight) : null,
            goodsPackages: data.goodsPackages ? Number(data.goodsPackages) : null,
            goodsPackagingUnit: data.goodsPackagingUnit ?? "COLIS",
            goodsDescription: data.goodsDescription || null,
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
