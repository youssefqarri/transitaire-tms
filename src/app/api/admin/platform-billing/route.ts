import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { encryptSecret } from "@/lib/crypto";
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
  // SMTP plateforme
  smtpHost: s,
  smtpPort: z.coerce.number().int().min(1).max(65535).nullable().optional(),
  smtpSecure: z.boolean().optional(),
  smtpUser: s,
  smtpPass: z.string().max(500).optional(), // saisi par l'utilisateur ; chiffré au repos
  smtpFrom: s,
});

// Met à jour l'identité de facturation de la plateforme (Evead). Singleton.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const { smtpPass, smtpPort, smtpSecure, ...rest } = parsed.data;
  // "" → null (champ vidé) ; undefined → inchangé.
  const clean: Record<string, unknown> = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, v === "" ? null : v]),
  );
  if (smtpPort !== undefined) clean.smtpPort = smtpPort;
  if (smtpSecure !== undefined) clean.smtpSecure = smtpSecure;
  // Mot de passe SMTP : chiffré si fourni non vide ; vide/absent → inchangé.
  if (typeof smtpPass === "string" && smtpPass.length > 0) clean.smtpPass = encryptSecret(smtpPass);

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
