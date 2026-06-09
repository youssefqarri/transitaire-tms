import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

const schema = z.object({
  type: z.enum(["dossier", "client", "document", "contact", "expectedDocument", "messageTemplate"]),
  id: z.string().min(1),
});

// POST /api/trash/restore — restaure un élément soft-deleted (deletedAt = null). Admin only.
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { type, id } = parsed.data;

  try {
    const data = { deletedAt: null };
    switch (type) {
      case "dossier": await prisma.dossier.update({ where: { id }, data }); break;
      case "client": await prisma.client.update({ where: { id }, data }); break;
      case "document": await prisma.document.update({ where: { id }, data }); break;
      case "contact": await prisma.clientContact.update({ where: { id }, data }); break;
      case "expectedDocument": await prisma.expectedDocument.update({ where: { id }, data }); break;
      case "messageTemplate": await prisma.messageTemplate.update({ where: { id }, data }); break;
    }
    await audit({ userId: session.user.id, action: "RESTORE", entity: type, entityId: id });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Conflit : un élément identique existe déjà." }, { status: 409 });
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }
}
