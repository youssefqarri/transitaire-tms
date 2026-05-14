import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  number: z.string().min(1),
  reference: z.string().optional(),
  type: z.enum(["IMPORT", "EXPORT"]),
  paymentMode: z.enum(["WITH_PAYMENT", "WITHOUT_PAYMENT"]),
  clientId: z.string().min(1),
  supplierId: z.string().optional(),
  goodsValue: z.string().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.string().optional(),
  goodsPackages: z.string().optional(),
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

  try {
    const dossier = await prisma.dossier.create({
      data: {
        number: data.number.trim(),
        reference: data.reference?.trim() || null,
        type: data.type,
        paymentMode: data.paymentMode,
        clientId: data.clientId,
        supplierId: data.supplierId || null,
        goodsValue: data.goodsValue ? Number(data.goodsValue) : null,
        goodsCurrency: data.goodsCurrency || "EUR",
        goodsWeight: data.goodsWeight ? Number(data.goodsWeight) : null,
        goodsPackages: data.goodsPackages ? Number(data.goodsPackages) : null,
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
      metadata: { number: dossier.number },
    });
    return NextResponse.json({ id: dossier.id });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ce numéro de dossier existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Erreur" }, { status: 500 });
  }
}
