import "server-only";
import { prisma } from "./db";
import { encryptSecret, decryptSecret } from "./crypto";

export type AppSettings = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  smtpSecure: boolean;
  storageDriver: "local" | "s3";
  s3Endpoint: string | null;
  s3Region: string | null;
  s3Bucket: string | null;
  s3AccessKeyId: string | null;
  s3SecretKey: string | null;
  s3PublicBaseUrl: string | null;
  invoiceSeqYear: number | null;
  invoiceSeqFloor: number | null;
  issuerName: string | null;
  issuerLegalForm: string | null;
  issuerAddress: string | null;
  issuerIce: string | null;
  issuerRc: string | null;
  issuerTaxId: string | null;
  issuerPatente: string | null;
  issuerCnss: string | null;
  issuerAgrement: string | null;
  issuerPhone: string | null;
  issuerEmail: string | null;
  issuerBank: string | null;
  issuerRib: string | null;
  issuerSwift: string | null;
};

/**
 * Récupère les paramètres. Priorité : DB (id=1) > .env > défauts.
 * Cache léger sur 30s pour éviter des reads à chaque mail / fichier.
 */
let cache: { value: AppSettings; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getSettings(): Promise<AppSettings> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  const row = await prisma.appSetting.findUnique({ where: { id: 1 } });
  const value: AppSettings = {
    smtpHost: row?.smtpHost ?? process.env.SMTP_HOST ?? null,
    smtpPort: row?.smtpPort ?? Number(process.env.SMTP_PORT ?? 587),
    smtpUser: row?.smtpUser ?? process.env.SMTP_USER ?? null,
    smtpPass: decryptSecret(row?.smtpPass) ?? process.env.SMTP_PASS ?? null,
    smtpFrom: row?.smtpFrom ?? process.env.SMTP_FROM ?? null,
    smtpSecure: row?.smtpSecure ?? false,
    storageDriver:
      (row?.storageDriver as "local" | "s3" | undefined) ??
      (process.env.STORAGE_DRIVER as "local" | "s3" | undefined) ??
      "local",
    s3Endpoint: row?.s3Endpoint ?? process.env.S3_ENDPOINT ?? null,
    s3Region: row?.s3Region ?? process.env.S3_REGION ?? null,
    s3Bucket: row?.s3Bucket ?? process.env.S3_BUCKET ?? null,
    s3AccessKeyId: row?.s3AccessKeyId ?? process.env.S3_ACCESS_KEY_ID ?? null,
    s3SecretKey: decryptSecret(row?.s3SecretKey) ?? process.env.S3_SECRET_ACCESS_KEY ?? null,
    s3PublicBaseUrl: row?.s3PublicBaseUrl ?? process.env.S3_PUBLIC_BASE_URL ?? null,
    invoiceSeqYear: row?.invoiceSeqYear ?? null,
    invoiceSeqFloor: row?.invoiceSeqFloor ?? null,
    issuerName: row?.issuerName ?? null,
    issuerLegalForm: row?.issuerLegalForm ?? null,
    issuerAddress: row?.issuerAddress ?? null,
    issuerIce: row?.issuerIce ?? null,
    issuerRc: row?.issuerRc ?? null,
    issuerTaxId: row?.issuerTaxId ?? null,
    issuerPatente: row?.issuerPatente ?? null,
    issuerCnss: row?.issuerCnss ?? null,
    issuerAgrement: row?.issuerAgrement ?? null,
    issuerPhone: row?.issuerPhone ?? null,
    issuerEmail: row?.issuerEmail ?? null,
    issuerBank: row?.issuerBank ?? null,
    issuerRib: row?.issuerRib ?? null,
    issuerSwift: row?.issuerSwift ?? null,
  };
  cache = { value, at: Date.now() };
  return value;
}

export async function updateSettings(
  patch: Partial<AppSettings>,
  userId?: string,
): Promise<AppSettings> {
  // chiffre les secrets au repos (no-op si ENCRYPTION_KEY absente)
  const enc = {
    ...patch,
    updatedById: userId,
    ...(typeof patch.smtpPass === "string" && patch.smtpPass
      ? { smtpPass: encryptSecret(patch.smtpPass) }
      : {}),
    ...(typeof patch.s3SecretKey === "string" && patch.s3SecretKey
      ? { s3SecretKey: encryptSecret(patch.s3SecretKey) }
      : {}),
  };
  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: enc,
    create: { id: 1, ...enc },
  });
  cache = null; // invalidate
  return getSettings();
}

export function invalidateSettingsCache() {
  cache = null;
}
