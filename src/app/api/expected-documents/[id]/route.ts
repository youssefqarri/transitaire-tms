import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { orgScope } from "@/lib/tenant";

const patchSchema = z.object({
  fulfilled: z.boolean().optional(),
  note: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role) || session.user.role === "COMMIS_DOUANE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.fulfilled !== undefined) {
    data.fulfilledAt = parsed.data.fulfilled ? new Date() : null;
  }
  if (parsed.data.note !== undefined) data.note = parsed.data.note?.trim() || null;
  if (parsed.data.name !== undefined) data.name = parsed.data.name?.trim() || null;

  const owns = await prisma.expectedDocument.findFirst({
    where: { id, dossier: { ...orgScope(session.user.orgId) } },
    select: { id: true },
  });
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const exp = await prisma.expectedDocument.update({ where: { id }, data });
  await audit({
    userId: session.user.id,
    action: "UPDATE_EXPECTED_DOC",
    entity: "ExpectedDocument",
    entityId: id,
    metadata: parsed.data,
  });
  return NextResponse.json(exp);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role) || session.user.role === "COMMIS_DOUANE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const owns = await prisma.expectedDocument.findFirst({
    where: { id, dossier: { ...orgScope(session.user.orgId) } },
    select: { id: true },
  });
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.expectedDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({
    userId: session.user.id,
    action: "SOFT_DELETE_EXPECTED_DOC",
    entity: "ExpectedDocument",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
