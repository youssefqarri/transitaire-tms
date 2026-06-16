import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { updateSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";

const schema = z.object({
  // SMTP
  smtpHost: z.string().nullable().optional(),
  smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpUser: z.string().nullable().optional(),
  smtpPass: z.string().nullable().optional(),
  smtpFrom: z.string().nullable().optional(),
  smtpSecure: z.boolean().optional(),
  // Stockage
  storageDriver: z.enum(["local", "s3"]).optional(),
  s3Endpoint: z.string().nullable().optional(),
  s3Region: z.string().nullable().optional(),
  s3Bucket: z.string().nullable().optional(),
  s3AccessKeyId: z.string().nullable().optional(),
  s3SecretKey: z.string().nullable().optional(),
  s3PublicBaseUrl: z.string().nullable().optional(),
  // Facturation : reprise de la série FA
  invoiceSeqYear: z.number().int().min(2000).max(9999).nullable().optional(),
  invoiceSeqFloor: z.number().int().min(1).nullable().optional(),
  // Émetteur de facture
  issuerName: z.string().nullable().optional(),
  issuerLegalForm: z.string().nullable().optional(),
  issuerAddress: z.string().nullable().optional(),
  issuerIce: z.string().nullable().optional(),
  issuerRc: z.string().nullable().optional(),
  issuerTaxId: z.string().nullable().optional(),
  issuerPatente: z.string().nullable().optional(),
  issuerCnss: z.string().nullable().optional(),
  issuerAgrement: z.string().nullable().optional(),
  issuerPhone: z.string().nullable().optional(),
  issuerEmail: z.string().nullable().optional(),
  issuerBank: z.string().nullable().optional(),
  issuerRib: z.string().nullable().optional(),
  issuerSwift: z.string().nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  // ne pas écrire les champs vides — on garde la valeur existante en DB
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    data[k] = typeof v === "string" ? (v.trim() || null) : v;
  }
  await updateSettings(data, session.user.id);
  await audit({
    userId: session.user.id,
    action: "UPDATE_SETTINGS",
    entity: "AppSetting",
    entityId: "1",
    metadata: { fields: Object.keys(data) },
  });
  return NextResponse.json({ ok: true });
}
