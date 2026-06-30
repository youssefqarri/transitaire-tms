import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/roles";
import { nextCreditNoteNumber } from "@/lib/invoicing-server";
import { audit } from "@/lib/audit";
import { orgScope, orgData } from "@/lib/tenant";

const schema = z.object({
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageInvoices(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, ...orgScope(session.user.orgId) },
    select: { id: true },
  });
  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  // Numérotation atomique avec retry en cas de collision @@unique([year, sequence]).
  let createdId: string | null = null;
  let lastNumber: string | null = null;
  for (let attempt = 0; attempt < 5 && !createdId; attempt++) {
    const next = await nextCreditNoteNumber();
    try {
      const cn = await prisma.creditNote.create({
        data: {
          ...orgData(session.user.orgId),
          number: next.number,
          year: next.year,
          sequence: next.sequence,
          invoiceId: id,
          amount: parsed.data.amount,
          reason: parsed.data.reason?.trim() || null,
          status: "ISSUED",
          createdById: session.user.id,
          issuedAt: new Date(),
        },
      });
      createdId = cn.id;
      lastNumber = cn.number;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002") continue; // collision n°, on retente
      return NextResponse.json({ error: "Erreur création avoir" }, { status: 500 });
    }
  }
  if (!createdId)
    return NextResponse.json({ error: "Impossible d'attribuer un numéro d'avoir" }, { status: 500 });

  await audit({
    userId: session.user.id,
    action: "CREATE_CREDIT_NOTE",
    entity: "CreditNote",
    entityId: createdId,
    metadata: { number: lastNumber, invoiceId: id, amount: parsed.data.amount },
  });

  return NextResponse.json({ id: createdId, number: lastNumber });
}
