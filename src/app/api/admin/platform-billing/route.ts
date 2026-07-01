import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

const s = z.string().trim().max(500).optional();
const schema = z.object({
  name: s,
  legalForm: s,
  address: s,
  city: s,
  ice: s,
  rc: s,
  taxId: s,
  patente: s,
  cnss: s,
  capital: s,
  phone: s,
  email: s,
  website: s,
  bank: s,
  rib: s,
  swift: s,
  invoicePrefix: z.string().trim().min(1).max(10).optional(),
  invoiceFooter: z.string().trim().max(2000).optional(),
});

// Met à jour l'identité de facturation de la plateforme (Evead). Singleton.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const d = parsed.data;
  // "" → null (champ vidé) ; undefined → inchangé.
  const clean = Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v]),
  );

  const row = await prisma.platformBilling.upsert({
    where: { id: "platform" },
    create: { id: "platform", ...clean },
    update: clean,
  });

  await audit({
    userId: session.user.id,
    action: "UPDATE_PLATFORM_BILLING",
    entity: "PlatformBilling",
    entityId: "platform",
    metadata: { name: row.name },
    orgId: null,
  });
  return NextResponse.json({ ok: true });
}
