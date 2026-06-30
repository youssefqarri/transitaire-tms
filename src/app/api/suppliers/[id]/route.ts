import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRegistry } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { orgScope } from "@/lib/tenant";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    data[k] = typeof v === "string" ? (v.trim() || null) : v;
  }

  // Isolation multi-tenant : ne modifier qu'un fournisseur de son org (no-op mono-tenant).
  const owned = await prisma.supplier.findFirst({
    where: { id, ...orgScope(session.user.orgId) },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const s = await prisma.supplier.update({ where: { id }, data });
    await audit({
      userId: session.user.id,
      action: "UPDATE_SUPPLIER",
      entity: "Supplier",
      entityId: id,
      orgId: session.user.orgId,
    });
    return NextResponse.json(s);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
