import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { sendMail, verifySmtp } from "@/lib/mail";

const schema = z.object({
  to: z.string().email().optional(),
});

/**
 * POST /api/settings/test-smtp
 * - Vérifie la connexion SMTP (auth)
 * - Si { to } fourni, envoie aussi un email de test à cette adresse
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const verify = await verifySmtp();
  if (!verify.ok) {
    return NextResponse.json({ ok: false, step: "verify", error: verify.error });
  }

  if (parsed.data.to) {
    try {
      const result = await sendMail({
        to: parsed.data.to,
        subject: "Test SMTP — Transitaire TMS",
        text:
          "Si vous lisez ce message, la configuration SMTP fonctionne correctement.\n\n" +
          "— Transitaire TMS",
      });
      return NextResponse.json({
        ok: true,
        verified: true,
        sent: true,
        messageId: result.messageId,
      });
    } catch (e: unknown) {
      return NextResponse.json({
        ok: false,
        step: "send",
        error: (e as Error).message,
      });
    }
  }

  return NextResponse.json({ ok: true, verified: true });
}
