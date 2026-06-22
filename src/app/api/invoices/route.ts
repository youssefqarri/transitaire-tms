import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canManageInvoices } from "@/lib/roles";
import { nextInvoiceNumber } from "@/lib/invoicing-server";

const itemSchema = z.object({
  kind: z.enum(["HONORAIRE", "DEBOURS", "AUTRE"]),
  code: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(30),
  dossierId: z.string().optional(),
});

const schema = z.object({
  number: z.string().optional(), // repris de l'ancien système ; si vide → numéro auto FA…
  clientId: z.string().min(1),
  dossierId: z.string().optional(),
  issuedAt: z.string().optional(),
  dueAt: z.string().optional(),
  termsOfPayment: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !canManageInvoices(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Numéro : repris de l'ancien système si fourni (format FA{AA}{série}), sinon auto-généré.
  const provided = data.number?.trim();
  const providedIsFA = !!provided && /^FA\d{2}\d+$/i.test(provided);
  async function resolveNumbering() {
    if (provided) {
      const m = /^FA(\d{2})(\d+)$/i.exec(provided);
      if (m) return { number: provided, year: 2000 + parseInt(m[1], 10), sequence: parseInt(m[2], 10) };
      // numéro libre (hors format FA) : année courante + séquence auto (unicité year/sequence)
      const auto = await nextInvoiceNumber();
      return { number: provided, year: auto.year, sequence: auto.sequence };
    }
    return nextInvoiceNumber();
  }

  let invoiceId: string | null = null;
  let lastNumber: string | null = null;
  for (let attempt = 0; attempt < 5 && !invoiceId; attempt++) {
    const next = await resolveNumbering();
    try {
      const created = await prisma.invoice.create({
        data: {
          number: next.number,
          year: next.year,
          sequence: next.sequence,
          clientId: data.clientId,
          dossierId: data.dossierId || null,
          status: "DRAFT",
          issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
          dueAt: data.dueAt ? new Date(data.dueAt) : null,
          termsOfPayment: data.termsOfPayment || null,
          notes: data.notes || null,
          createdById: session.user.id,
          items: {
            create: data.items.map((it, i) => ({
              kind: it.kind,
              code: it.code || null,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              // Le taux est porté par la ligne : 0 % pour un débours refacturé à
              // l'identique, mais p.ex. 10 % pour du transport débours.
              vatRate: it.vatRate,
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
      // numéro explicite déjà pris → vrai doublon ; sinon collision auto → retry
      if (err.code === "P2002") {
        if (providedIsFA)
          return NextResponse.json({ error: "Ce numéro de facture existe déjà" }, { status: 409 });
        continue;
      }
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
