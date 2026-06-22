import "server-only";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { ISSUER, type Issuer } from "./invoicing";

/**
 * Émetteur effectif de la facture : valeurs saisies en base (AppSetting) si
 * présentes, sinon valeurs par défaut codées (constante ISSUER). Permet de
 * modifier les coordonnées légales sans redéploiement.
 */
export async function getIssuer(): Promise<Issuer> {
  const s = await getSettings();
  return {
    name: s.issuerName ?? ISSUER.name,
    legalForm: s.issuerLegalForm ?? ISSUER.legalForm,
    address: s.issuerAddress ?? ISSUER.address,
    ice: s.issuerIce ?? ISSUER.ice,
    rc: s.issuerRc ?? ISSUER.rc,
    taxId: s.issuerTaxId ?? ISSUER.taxId,
    patente: s.issuerPatente ?? ISSUER.patente,
    cnss: s.issuerCnss ?? ISSUER.cnss,
    agrement: s.issuerAgrement ?? ISSUER.agrement,
    phone: s.issuerPhone ?? ISSUER.phone,
    email: s.issuerEmail ?? ISSUER.email,
    bank: s.issuerBank ?? ISSUER.bank,
    rib: s.issuerRib ?? ISSUER.rib,
    swift: s.issuerSwift ?? ISSUER.swift,
  };
}

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
  // Plancher de reprise (démarrage de l'outil) : si l'admin a fixé un « prochain
  // numéro » pour cette année, on ne descend jamais en dessous.
  const settings = await getSettings();
  const floor = settings.invoiceSeqYear === year ? settings.invoiceSeqFloor ?? 0 : 0;
  const sequence = Math.max((last?.sequence ?? 0) + 1, floor);
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
