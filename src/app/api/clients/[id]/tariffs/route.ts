import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices, canViewInvoices } from "@/lib/roles";
import { audit } from "@/lib/audit";

const itemSchema = z.object({
  kind: z.enum(["HONORAIRE", "DEBOURS", "AUTRE"]).default("HONORAIRE"),
  code: z.string().nullable().optional(),
  description: z.string().min(1),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(100),
});
const schema = z.object({ items: z.array(itemSchema).max(50) });

// GET : fiche tarifaire du client (lignes récurrentes), pour l'éditeur et
// l'auto-remplissage de la facture.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canViewInvoices(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.clientTariff.findMany({
    where: { clientId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({
    items: rows.map((r) => ({
      kind: r.kind,
      code: r.code,
      description: r.description,
      unitPrice: Number(r.unitPrice),
      vatRate: Number(r.vatRate),
    })),
  });
}

// PUT : remplace l'intégralité de la fiche tarifaire du client.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageInvoices(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findFirst({ where: { id, deletedAt: null } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  await prisma.$transaction([
    prisma.clientTariff.deleteMany({ where: { clientId: id } }),
    prisma.clientTariff.createMany({
      data: parsed.data.items.map((it, i) => ({
        clientId: id,
        kind: it.kind,
        code: it.code?.trim() || null,
        description: it.description.trim(),
        unitPrice: it.unitPrice,
        vatRate: it.vatRate,
        order: i,
      })),
    }),
  ]);

  await audit({
    userId: session.user.id,
    action: "UPDATE_CLIENT_TARIFFS",
    entity: "Client",
    entityId: id,
    metadata: { count: parsed.data.items.length },
  });

  return NextResponse.json({ ok: true, count: parsed.data.items.length });
}
