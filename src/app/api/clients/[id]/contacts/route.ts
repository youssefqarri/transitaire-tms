import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRegistry } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { orgScope } from "@/lib/tenant";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

// POST /api/clients/[id]/contacts — ajoute un contact (destinataire) au client
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 });

  // Isolation multi-tenant : le client (parent) doit appartenir à l'org (no-op mono-tenant).
  const owned = await prisma.client.findFirst({
    where: { id, ...orgScope(session.user.orgId) },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  try {
    const contact = await prisma.clientContact.create({
      data: {
        clientId: id,
        email: parsed.data.email.trim(),
        name: parsed.data.name?.trim() || null,
      },
    });
    await audit({
      userId: session.user.id,
      action: "CREATE_CLIENT_CONTACT",
      entity: "Client",
      entityId: id,
      metadata: { email: contact.email },
      orgId: session.user.orgId,
    });
    return NextResponse.json(contact);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Cet email existe déjà pour ce client" }, { status: 409 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
