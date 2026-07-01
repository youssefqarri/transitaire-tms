import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { orgScope, orgData } from "@/lib/tenant";
import { orgDossierQuota } from "@/lib/entitlements";
import { nextProvisionalDossierNumber } from "@/lib/dossier-numbering";

const createSchema = z.object({
  reference: z.string().optional(),
  type: z.enum(["IMPORT", "EXPORT"]).default("IMPORT"),
  paymentMode: z.enum(["WITH_PAYMENT", "WITHOUT_PAYMENT"]).default("WITHOUT_PAYMENT"),
  supplierName: z.string().optional(),
  goodsValue: z.string().optional(),
  goodsCurrency: z.string().optional(),
  goodsWeight: z.string().optional(),
  goodsPackages: z.string().optional(),
  goodsPackagingUnit: z.enum(["COLIS", "PALETTES", "CONTENEURS", "REMORQUES"]).optional(),
  goodsDescription: z.string().optional(),
});

// Création d'un dossier par le client via le portail.
// Le clientId est forcé depuis la session, pas de choix possible.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT" || !session.user.clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const orgId = session.user.orgId;

  // Fournisseur : si renseigné, on tente de le trouver/créer
  let supplierId: string | null = null;
  if (data.supplierName?.trim()) {
    const name = data.supplierName.trim();
    const existing = await prisma.supplier.findFirst({ where: { ...orgScope(orgId), name } });
    if (existing) {
      supplierId = existing.id;
    } else {
      const created = await prisma.supplier.create({ data: { ...orgData(orgId), name } });
      supplierId = created.id;
    }
  }

  let number = await nextProvisionalDossierNumber(undefined, orgId);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const dossier = await prisma.dossier.create({
        data: {
          ...orgData(orgId),
          number,
          reference: data.reference?.trim() || null,
          type: data.type,
          paymentMode: data.paymentMode,
          clientId: session.user.clientId,
          supplierId,
          goodsValue: data.goodsValue ? Number(data.goodsValue) : null,
          goodsCurrency: data.goodsCurrency || "EUR",
          goodsWeight: data.goodsWeight ? Number(data.goodsWeight) : null,
          goodsPackages: data.goodsPackages ? Number(data.goodsPackages) : null,
          goodsPackagingUnit: data.goodsPackagingUnit ?? "COLIS",
          goodsDescription: data.goodsDescription || null,
          createdById: session.user.id,
          status: "OUVERTURE",
          statusChanges: {
            create: {
              toStatus: "OUVERTURE",
              changedById: session.user.id,
              note: "Dossier créé par le client via le portail",
            },
          },
        },
      });

      // Notification interne (Admin + Exploitation + Déclarant + Bureau)
      const client = await prisma.client.findFirst({
        where: { ...orgScope(orgId), id: session.user.clientId },
        select: { name: true },
      });
      const title = `Nouveau dossier — ${client?.name ?? "client"}`;
      const body = `${client?.name ?? "Le client"} vient d'ouvrir le dossier ${dossier.number}${data.reference ? ` (réf. ${data.reference})` : ""}.`;
      await prisma.notification.createMany({
        data: (["ADMIN", "EXPLOITATION", "DECLARANT", "BUREAU"] as const).map((role) => ({
          ...orgData(orgId),
          role,
          dossierId: dossier.id,
          kind: "CLIENT_NEW_DOSSIER",
          title,
          body,
          link: `/dossiers/${dossier.id}`,
        })),
      });

      await audit({
        userId: session.user.id,
        action: "CLIENT_CREATE_DOSSIER",
        entity: "Dossier",
        entityId: dossier.id,
        metadata: { number: dossier.number, reference: data.reference },
        orgId,
      });

      // Quota SOUPLE : indicateur seulement (dépassement facturable, non bloquant).
      const quota = await orgDossierQuota(orgId);
      return NextResponse.json({
        id: dossier.id,
        number: dossier.number,
        quotaWarning: quota.over,
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "P2002") {
        number = await nextProvisionalDossierNumber(undefined, orgId);
        continue;
      }
      return NextResponse.json({ error: err.message || "Erreur" }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Impossible d'attribuer un numéro (réessayer)" },
    { status: 500 },
  );
}
