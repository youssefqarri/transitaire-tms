import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRegistry } from "@/lib/roles";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  ice: z.string().nullable().optional(),
  rc: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
  separateDebours: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // normalise les chaînes vides → null
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    data[k] = typeof v === "string" ? (v.trim() || null) : v;
  }
  if (data.name !== undefined && !data.name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  try {
    const c = await prisma.client.update({ where: { id }, data });
    await audit({
      userId: session.user.id,
      action: "UPDATE_CLIENT",
      entity: "Client",
      entityId: id,
      metadata: { fields: Object.keys(data) },
    });
    return NextResponse.json(c);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findUnique({
    where: { id },
    include: { _count: { select: { dossiers: { where: { deletedAt: null } } } } },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (client.deletedAt) return NextResponse.json({ ok: true });

  if (client._count.dossiers > 0) {
    return NextResponse.json(
      {
        error: `Impossible de supprimer : ce client a ${client._count.dossiers} dossier(s) actif(s). Supprimez ou réaffectez d'abord les dossiers.`,
      },
      { status: 409 },
    );
  }

  // soft-delete : le client est masqué mais conservé (historique, audit)
  await prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({
    userId: session.user.id,
    action: "SOFT_DELETE_CLIENT",
    entity: "Client",
    entityId: id,
    metadata: { name: client.name },
  });
  return NextResponse.json({ ok: true });
}
