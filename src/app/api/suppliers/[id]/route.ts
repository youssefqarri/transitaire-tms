import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { audit } from "@/lib/audit";

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
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    data[k] = typeof v === "string" ? (v.trim() || null) : v;
  }

  try {
    const s = await prisma.supplier.update({ where: { id }, data });
    await audit({
      userId: session.user.id,
      action: "UPDATE_SUPPLIER",
      entity: "Supplier",
      entityId: id,
    });
    return NextResponse.json(s);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
