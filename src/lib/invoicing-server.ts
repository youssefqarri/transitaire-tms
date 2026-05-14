import "server-only";
import { prisma } from "./db";

/**
 * Génère le prochain numéro de facture pour l'année donnée.
 * Format : F-YYYY-NNNN (séquence incrémentale par année, paddée à 4 chiffres).
 * Atomique grâce à la contrainte @@unique([year, sequence]) en DB.
 */
export async function nextInvoiceNumber(year = new Date().getFullYear()): Promise<{
  year: number;
  sequence: number;
  number: string;
}> {
  const last = await prisma.invoice.findFirst({
    where: { year },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  const sequence = (last?.sequence ?? 0) + 1;
  return { year, sequence, number: `F-${year}-${String(sequence).padStart(4, "0")}` };
}
