import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // On limite aux notifications adressées à l'utilisateur ou à son rôle
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = n.userId === session.user.id || n.role === session.user.role;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.notification.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
