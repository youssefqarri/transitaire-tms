import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const rl = await checkRateLimit(`reset:${clientIp(req)}`, 10, 15 * 60);
  if (!rl.ok)
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const vt = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
  if (!vt) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  if (vt.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return NextResponse.json({ error: "Lien expiré" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: vt.identifier } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, tokenVersion: { increment: 1 }, passwordChangedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: tokenHash } }),
  ]);

  await audit({
    userId: user.id,
    action: "PASSWORD_RESET",
    entity: "User",
    entityId: user.id,
  });

  return NextResponse.json({ ok: true });
}
