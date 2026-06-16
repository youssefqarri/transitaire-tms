import "server-only";
import { prisma } from "./db";

/**
 * Génère le prochain numéro de facture pour l'année donnée.
 * Format : FA{AA}{NNNN} (ex. FA260001 = année 2026, séquence 1), conforme à la
 * série réelle du transitaire (ex. FA261194). Séquence incrémentale par année,
 * paddée à 4 chiffres. Atomique grâce à @@unique([year, sequence]) en DB.
 *
 * NB go-live : pour reprendre la série existante (ex. à partir de 1195), créer une
 * première facture avec la séquence voulue ou ajuster la séquence de départ en base ;
 * la comptable doit confirmer le numéro de reprise.
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
  const yy = String(year).slice(-2);
  return { year, sequence, number: `FA${yy}${String(sequence).padStart(4, "0")}` };
}

/**
 * Prochain numéro d'avoir (note de crédit). Format : AV{AA}{NNNN}.
 * Séquence propre par année, atomique via @@unique([year, sequence]) sur CreditNote.
 */
export async function nextCreditNoteNumber(year = new Date().getFullYear()): Promise<{
  year: number;
  sequence: number;
  number: string;
}> {
  const last = await prisma.creditNote.findFirst({
    where: { year },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  const sequence = (last?.sequence ?? 0) + 1;
  const yy = String(year).slice(-2);
  return { year, sequence, number: `AV${yy}${String(sequence).padStart(4, "0")}` };
}
