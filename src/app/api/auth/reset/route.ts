import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  const { token, password } = parsed.data;

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  if (vt.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.json({ error: "Lien expiré" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: vt.identifier } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  await audit({
    userId: user.id,
    action: "PASSWORD_RESET",
    entity: "User",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true });
}
