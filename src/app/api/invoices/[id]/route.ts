import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { isInternal } from "@/lib/roles";

const patchSchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "CANCELLED", "OVERDUE"])
    .optional(),
  paidAmount: z.number().min(0).optional(),
  paidAt: z.string().nullable().optional(),
  paymentMethod: z
    .enum(["VIREMENT", "CHEQUE", "ESPECES", "CMI", "TRAITE", "AUTRE"])
    .nullable()
    .optional(),
  paymentRef: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  issuedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...parsed.data,
      paidAt:
        parsed.data.paidAt === undefined
          ? undefined
          : parsed.data.paidAt
          ? new Date(parsed.data.paidAt)
          : null,
      dueAt:
        parsed.data.dueAt === undefined
          ? undefined
          : parsed.data.dueAt
          ? new Date(parsed.data.dueAt)
          : null,
      issuedAt:
        parsed.data.issuedAt === undefined
          ? undefined
          : parsed.data.issuedAt
          ? new Date(parsed.data.issuedAt)
          : null,
    },
  });
  await audit({
    userId: session.user.id,
    action: "UPDATE_INVOICE",
    entity: "Invoice",
    entityId: id,
    metadata: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // On annule plutôt que supprimer (immuabilité des factures)
  await prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  await audit({
    userId: session.user.id,
    action: "CANCEL_INVOICE",
    entity: "Invoice",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
