import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { previewSubscriptionInvoice } from "@/lib/subscription-notify";

// Aperçu du mail (objet/corps/destinataire) avant envoi — pas d'envoi.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reminder = new URL(req.url).searchParams.get("reminder") === "1";
  const preview = await previewSubscriptionInvoice(id, reminder);
  if (!preview) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  return NextResponse.json(preview);
}
