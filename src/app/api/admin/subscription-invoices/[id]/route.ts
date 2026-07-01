import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

const schema = z.object({
  amount: z.number().positive().optional(), // montant encaissé ; absent = solde restant (paiement total)
  method: z.string().optional(), // virement / chèque / espèces / traite / autre
  reference: z.string().optional(),
  date: z.string().optional(), // date d'encaissement (ISO yyyy-mm-dd)
});

// Enregistre un encaissement (hors-ligne) sur une facture d'abonnement. Réservé
// aux admins plateforme. Supporte les paiements partiels : tant que le cumul
// encaissé < montant, la facture reste « en attente » (affichée « Partiel ») ;
// dès qu'il couvre le montant, elle passe « Payée ». Corps vide = solder en une fois.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const inv = await prisma.subscriptionInvoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const d = parsed.data;

  // Le cabinet règle le TTC : total à encaisser = HT × (1 + TVA%).
  const ht = Number(inv.amount);
  const total = Math.round(ht * (1 + Number(inv.vatRate) / 100) * 100) / 100;
  const already = Number(inv.paidAmount);
  const remaining = Math.max(0, total - already);
  const pay = d.amount ?? remaining; // par défaut : solder le restant
  const newPaid = Math.min(total, Math.round((already + pay) * 100) / 100);
  const fullyPaid = newPaid >= total;
  const payDate = d.date ? new Date(d.date) : new Date();

  const updated = await prisma.subscriptionInvoice.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      status: fullyPaid ? "PAID" : "PENDING",
      paidAt: fullyPaid ? payDate : null,
      ...(d.method ? { method: d.method } : {}),
      ...(d.reference !== undefined ? { reference: d.reference || null } : {}),
    },
  });

  await audit({
    userId: session.user.id,
    action: "RECORD_SUBSCRIPTION_PAYMENT",
    entity: "SubscriptionInvoice",
    entityId: id,
    metadata: { orgId: inv.orgId, pay, newPaid, total, method: d.method, reference: d.reference },
    orgId: inv.orgId,
  });

  return NextResponse.json({ id: updated.id, status: updated.status, paidAmount: newPaid });
}
