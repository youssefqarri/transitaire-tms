import "server-only";
import { prisma } from "./db";
import { round2 } from "./invoicing";
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
};

/** Lit l'identité de facturation de la plateforme (singleton). Jamais null. */
export async function getPlatformBilling(): Promise<PlatformBilling> {
  const row = await prisma.platformBilling.findUnique({ where: { id: "platform" } });
  return row ?? DEFAULTS;
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
