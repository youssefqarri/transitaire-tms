import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { canCreateDossier } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({
  number: z.string().min(1),
  reference: z.string().optional(),
  type: z.enum(["IMPORT", "EXPORT"]).default("IMPORT"),
  paymentMode: z.enum(["WITH_PAYMENT", "WITHOUT_PAYMENT"]).default("WITH_PAYMENT"),
  clientId: z.string().min(1),
  supplierId: z.string().optional(),
  goodsValue: z.number().optional(),
  goodsCurrency: z.string().default("EUR"),
  goodsWeight: z.number().optional(),
  goodsPackages: z.number().int().optional(),
  goodsDescription: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canCreateDossier(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
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
        goodsValue: data.goodsValue ?? null,
        goodsCurrency: data.goodsCurrency,
        goodsWeight: data.goodsWeight ?? null,
        goodsPackages: data.goodsPackages ?? null,
        goodsDescription: data.goodsDescription || null,
        createdById: ctx.userId,
        receivedAt: new Date(),
        status: "RECEPTIONNE",
        statusChanges: {
          create: {
            toStatus: "RECEPTIONNE",
            changedById: ctx.userId,
            note: ctx.via === "token" ? "Création via API" : "Création du dossier",
          },
        },
      },
      include: { client: true, dums: true },
    });
    await audit({
      userId: ctx.userId,
      action: "CREATE_DOSSIER",
      entity: "Dossier",
      entityId: dossier.id,
      metadata: { number: dossier.number, via: ctx.via },
    });
    return NextResponse.json(dossier);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Numéro de dossier déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Erreur" }, { status: 500 });
  }
}
