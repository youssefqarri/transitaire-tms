import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendMail, textToHtml } from "@/lib/mail";
import { audit } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/forgot
 * Génère un token de reset password et l'envoie par email.
 * Toujours retourne 200 (même si email inconnu) pour éviter d'énumérer les comptes.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: true }); // silencieux

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return NextResponse.json({ ok: true });
  }

  // Génère un token aléatoire 32 bytes hex ; on ne stocke que son HASH sha256.
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  // Purge les anciens tokens de reset de cet email, puis stocke le hash
  await prisma.verificationToken.deleteMany({ where: { identifier: email } }).catch(() => {});
  await prisma.verificationToken.create({
    data: { identifier: email, token: tokenHash, expires },
  });

  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const link = `${base}/reset-password/${token}`; // le lien contient le token BRUT

  try {
    await sendMail({
      to: email,
      subject: "Réinitialisation de votre mot de passe — Transitaire",
      text:
        `Bonjour ${user.name},\n\n` +
        `Vous avez demandé à réinitialiser votre mot de passe.\n\n` +
        `Cliquez sur le lien suivant (valide 1 heure) :\n${link}\n\n` +
        `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n` +
        `— Transitaire`,
      html: textToHtml(
        `Bonjour ${user.name},\n\n` +
          `Vous avez demandé à réinitialiser votre mot de passe.\n\n` +
          `Cliquez sur le lien suivant (valide 1 heure) :\n${link}\n\n` +
          `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      ),
    });
    await audit({
      userId: user.id,
      action: "REQUEST_PASSWORD_RESET",
      entity: "User",
      entityId: user.id,
    });
  } catch (e: unknown) {
    // log mais ne révèle pas l'erreur au client
    console.error("[forgot] mail error:", (e as Error).message);
  }

  return NextResponse.json({ ok: true });
}
