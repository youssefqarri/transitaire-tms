import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({ active: z.boolean() });

// Activer / désactiver un compte. Désactiver = bloque la connexion ET ferme
// immédiatement les sessions en cours (tokenVersion incrémenté → auth.ts rejette).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (id === session.user.id)
    return NextResponse.json(
      { error: "Vous ne pouvez pas désactiver votre propre compte." },
      { status: 400 },
    );

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  try {
    const user = await prisma.user.update({
      where: { id },
      data: parsed.data.active
        ? { active: true }
        : { active: false, tokenVersion: { increment: 1 } },
      select: { id: true, name: true, active: true },
    });
    await audit({
      userId: session.user.id,
      action: parsed.data.active ? "REACTIVATE_USER" : "DEACTIVATE_USER",
      entity: "User",
      entityId: id,
      metadata: { name: user.name },
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2025") return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
