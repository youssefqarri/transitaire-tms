import "server-only";
import { prisma } from "./db";
import { round2 } from "./invoicing";
import { decryptSecret } from "./crypto";
import type { Prisma } from "@/generated/prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Facturation d'abonnement (plateforme Evead → cabinets). L'émetteur est stocké
// dans le singleton PlatformBilling (id « platform »). `SubscriptionInvoice.amount`
// est HT ; la TVA (par défaut 20 %) est portée par `vatRate`.
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformBilling = {
  id: string;
  name: string | null;
  legalForm: string | null;
  address: string | null;
  city: string | null;
  ice: string | null;
  rc: string | null;
  taxId: string | null;
  patente: string | null;
  cnss: string | null;
  capital: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bank: string | null;
  rib: string | null;
  swift: string | null;
  invoicePrefix: string;
  invoiceFooter: string | null;
  // SMTP plateforme — champs non secrets exposables ; le mot de passe n'est jamais
  // renvoyé (seul `hasSmtpPass` indique s'il est défini).
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpFrom: string | null;
  hasSmtpPass: boolean;
};

const DEFAULTS: PlatformBilling = {
  id: "platform",
  name: null,
  legalForm: null,
  address: null,
  city: null,
  ice: null,
  rc: null,
  taxId: null,
  patente: null,
  cnss: null,
  capital: null,
  phone: null,
  email: null,
  website: null,
  bank: null,
  rib: null,
  swift: null,
  invoicePrefix: "ESC",
  invoiceFooter: null,
  smtpHost: null,
  smtpPort: null,
  smtpSecure: false,
  smtpUser: null,
  smtpFrom: null,
  hasSmtpPass: false,
};

/** Lit l'identité de facturation de la plateforme (singleton). Jamais null.
 *  N'expose PAS le mot de passe SMTP (seulement `hasSmtpPass`). */
export async function getPlatformBilling(): Promise<PlatformBilling> {
  const row = await prisma.platformBilling.findUnique({ where: { id: "platform" } });
  if (!row) return DEFAULTS;
  const { smtpPass, createdAt: _c, updatedAt: _u, ...rest } = row;
  return { ...rest, hasSmtpPass: Boolean(smtpPass) };
}

/** Config SMTP plateforme déchiffrée (server-only, pour l'envoi). null si incomplète. */
export async function getPlatformSmtp(): Promise<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
} | null> {
  const row = await prisma.platformBilling.findUnique({ where: { id: "platform" } });
  if (!row?.smtpHost || !row.smtpUser || !row.smtpPass) return null;
  const pass = decryptSecret(row.smtpPass);
  if (!pass) return null;
  const port = row.smtpPort ?? 587;
  return {
    host: row.smtpHost,
    port,
    secure: row.smtpSecure || port === 465,
    user: row.smtpUser,
    pass,
    from: row.smtpFrom || row.smtpUser,
  };
}

/** Renvoie true si l'émetteur est suffisamment renseigné pour émettre une facture. */
export function isPlatformBillingReady(p: PlatformBilling): boolean {
  return Boolean(p.name && p.ice && p.address);
}

/** Totaux d'une facture d'abonnement : amount = HT → TVA + TTC. */
export function subTotals(amountHT: number, vatRate: number): {
  ht: number;
  vat: number;
  ttc: number;
} {
  const ht = round2(amountHT);
  const vat = round2((ht * vatRate) / 100);
  return { ht, vat, ttc: round2(ht + vat) };
}

/** Prochain numéro de facture d'abonnement de l'année (ex. ESC-2026-0001). */
export async function nextSubInvoiceNumber(
  tx: Prisma.TransactionClient,
  prefix: string,
  year: number,
): Promise<string> {
  const count = await tx.subscriptionInvoice.count({
    where: { number: { startsWith: `${prefix}-${year}-` } },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}
