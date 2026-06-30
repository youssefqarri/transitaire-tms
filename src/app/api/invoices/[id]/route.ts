import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canManageInvoices } from "@/lib/roles";
import { orgScope } from "@/lib/tenant";

const itemSchema = z.object({
  kind: z.enum(["HONORAIRE", "DEBOURS", "AUTRE"]),
  code: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(30),
});

const patchSchema = z.object({
  // Workflow (statut / paiement) — Comptabilité + Admin
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
  // Contenu (édition) — brouillon : Compta + Admin ; finalisée : Admin uniquement
  clientId: z.string().optional(),
  dossierId: z.string().nullable().optional(),
  termsOfPayment: z.string().nullable().optional(),
  items: z.array(itemSchema).min(1).optional(),
});

const dateField = (v: string | null | undefined) =>
  v === undefined ? undefined : v ? new Date(v) : null;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageInvoices(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const d = parsed.data;

  const invoice = await prisma.invoice.findFirst({ where: { ...orgScope(session.user.orgId), id } });
  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  // Édition du CONTENU (lignes / client / dossier / conditions) :
  // brouillon → Comptabilité + Admin ; facture finalisée → Admin uniquement.
  const editingContent =
    d.items !== undefined ||
    d.clientId !== undefined ||
    d.dossierId !== undefined ||
    d.termsOfPayment !== undefined;
  if (editingContent && invoice.status !== "DRAFT" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Facture finalisée : seul un administrateur peut la modifier." },
      { status: 403 },
    );
  }

  await prisma.$transaction(async (tx) => {
    if (d.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.createMany({
        data: d.items.map((it, i) => ({
          invoiceId: id,
          kind: it.kind,
          code: it.code || null,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          vatRate: it.vatRate,
          order: i,
        })),
      });
    }
    await tx.invoice.update({
      where: { id },
      data: {
        status: d.status,
        paidAmount: d.paidAmount,
        paymentMethod: d.paymentMethod,
        paymentRef: d.paymentRef,
        notes: d.notes,
        clientId: d.clientId,
        dossierId: d.dossierId,
        termsOfPayment: d.termsOfPayment,
        paidAt: dateField(d.paidAt),
        dueAt: dateField(d.dueAt),
        issuedAt: dateField(d.issuedAt),
      },
    });
  });

  await audit({
    userId: session.user.id,
    action: "UPDATE_INVOICE",
    entity: "Invoice",
    entityId: id,
    metadata: { fields: Object.keys(d) },
    orgId: session.user.orgId,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inv = await prisma.invoice.findFirst({ where: { ...orgScope(session.user.orgId), id } });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // On annule plutôt que supprimer (immuabilité des factures)
  await prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  await audit({
    userId: session.user.id,
    action: "CANCEL_INVOICE",
    entity: "Invoice",
    entityId: id,
    orgId: session.user.orgId,
  });
  return NextResponse.json({ ok: true });
}
