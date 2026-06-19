import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { verifyWhatsApp, sendWhatsApp } from "@/lib/whatsapp";

const schema = z.object({ to: z.string().optional() });

/**
 * POST /api/settings/test-whatsapp
 * - Vérifie l'état de la session WhatsApp (OpenWA/WAHA)
 * - Si { to } fourni, envoie aussi un message de test à ce numéro
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const verify = await verifyWhatsApp();
  const to = parsed.data.to?.trim();

  // Avec un numéro : on tente l'envoi réel (test concret), sans bloquer sur le statut
  // de session (la chaîne de statut varie selon WAHA / open-wa).
  if (to) {
    try {
      const result = await sendWhatsApp({
        to,
        text: "Test WhatsApp — Escale ✅\nSi vous lisez ce message, la configuration fonctionne.",
      });
      return NextResponse.json({
        ok: true,
        verified: true,
        sent: true,
        status: verify.status,
        messageId: result.messageId,
      });
    } catch (e: unknown) {
      return NextResponse.json({ ok: false, step: "send", status: verify.status, error: (e as Error).message });
    }
  }

  // Sans numéro : on rapporte l'état de la session.
  if (!verify.ok) {
    return NextResponse.json({ ok: false, step: "verify", status: verify.status, error: verify.error });
  }
  return NextResponse.json({ ok: true, verified: true, status: verify.status });
}
