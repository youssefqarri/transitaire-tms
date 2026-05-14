import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { isInternal } from "@/lib/roles";
import { nextInvoiceNumber } from "@/lib/invoicing-server";

const itemSchema = z.object({
  kind: z.enum(["HONORAIRE", "DEBOURS", "AUTRE"]),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(30),
  dossierId: z.string().optional(),
});

const schema = z.object({
  clientId: z.string().min(1),
  issuedAt: z.string().optional(),
  dueAt: z.string().optional(),
  termsOfPayment: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Numérotation séquentielle annuelle — retry en cas de collision @@unique(year, sequence)
  let invoiceId: string | null = null;
  let lastNumber: string | null = null;
  for (let attempt = 0; attempt < 5 && !invoiceId; attempt++) {
    const next = await nextInvoiceNumber();
    try {
      const created = await prisma.invoice.create({
        data: {
          number: next.number,
          year: next.year,
          sequence: next.sequence,
          clientId: data.clientId,
          status: "DRAFT",
          issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
          dueAt: data.dueAt ? new Date(data.dueAt) : null,
          termsOfPayment: data.termsOfPayment || null,
          notes: data.notes || null,
          createdById: session.user.id,
          items: {
            create: data.items.map((it, i) => ({
              kind: it.kind,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              vatRate: it.kind === "DEBOURS" ? 0 : it.vatRate,
              dossierId: it.dossierId,
              order: i,
            })),
          },
        },
      });
      invoiceId = created.id;
      lastNumber = created.number;
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "P2002") continue; // conflit numérotation, on retry
      return NextResponse.json({ error: "Erreur création" }, { status: 500 });
    }
  }
  if (!invoiceId) {
    return NextResponse.json(
      { error: "Impossible d'attribuer un numéro de facture (réessayer)" },
      { status: 500 },
    );
  }
  await audit({
    userId: session.user.id,
    action: "CREATE_INVOICE",
    entity: "Invoice",
    entityId: invoiceId,
    metadata: { number: lastNumber },
  });
  return NextResponse.json({ id: invoiceId, number: lastNumber });
}
