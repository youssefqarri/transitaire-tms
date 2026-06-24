import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Récupère le clientId du client connecté (rôle CLIENT uniquement).
async function clientScope() {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT" || !session.user.clientId) return null;
  return session.user.clientId;
}

const contact = z.string().trim().max(40);
const patchSchema = z.object({
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  phone: contact.optional(),
  whatsapp: contact.optional(),
});

// PATCH : met à jour les coordonnées principales du client.
export async function PATCH(req: NextRequest) {
  const clientId = await clientScope();
  if (!clientId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const { email, phone, whatsapp } = parsed.data;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone.trim() || null }),
      ...(whatsapp !== undefined && { whatsapp: whatsapp.trim() || null }),
    },
  });
  return NextResponse.json({ ok: true });
}

// POST : ajoute un email au carnet (ClientContact) du client.
export async function POST(req: NextRequest) {
  const clientId = await clientScope();
  if (!clientId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = z.object({ email: z.string().trim().email() }).safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 });

  const exists = await prisma.clientContact.findFirst({
    where: { clientId, email: parsed.data.email, deletedAt: null },
    select: { id: true },
  });
  if (!exists) {
    await prisma.clientContact.create({ data: { clientId, email: parsed.data.email } });
  }
  return NextResponse.json({ ok: true });
}

// DELETE : retire un email du carnet (uniquement ceux de SON client).
export async function DELETE(req: NextRequest) {
  const clientId = await clientScope();
  if (!clientId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 });

  await prisma.clientContact.updateMany({
    where: { id: parsed.data.id, clientId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
