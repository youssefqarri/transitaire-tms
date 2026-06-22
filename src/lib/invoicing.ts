import type {
  InvoiceItemKind,
  InvoiceStatus,
  PaymentMethod,
  CreditNoteStatus,
} from "@/generated/prisma/enums";

// Émetteur de la facture — coordonnées légales réelles du transitaire.
// En dur pour l'instant ; à rendre configurable (AppSetting / multi-tenant) ensuite.
export const ISSUER = {
  name: "TRANSIT MULTISERVICES",
  legalForm: "SARL",
  address: "1, Place Al Istiqlal (ex Mirabeau), Casablanca",
  ice: "000027502000078",
  rc: "101747",
  taxId: "1068374", // Identifiant Fiscal
  patente: "32101053",
  cnss: "1006700",
  agrement: "1223", // agrément transitaire en douane
  phone: "0522 30 75 73 / 0522 30 06 99",
  email: "tms@transitmultiservices.com",
  bank: "CIH Bank",
  rib: "230 780 5185605221010700 68",
  swift: "CIHMMAMC",
} as const;

export type Issuer = {
  name: string;
  legalForm: string;
  address: string;
  ice: string;
  rc: string;
  taxId: string;
  patente: string;
  cnss: string;
  agrement: string;
  phone: string;
  email: string;
  bank: string;
  rib: string;
  swift: string;
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PARTIALLY_PAID: "Partiellement réglée",
  PAID: "Réglée",
  CANCELLED: "Annulée",
  OVERDUE: "En retard",
};

export const INVOICE_ITEM_KIND_LABELS: Record<InvoiceItemKind, string> = {
  HONORAIRE: "Honoraires",
  DEBOURS: "Débours",
  AUTRE: "Autre",
};

export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  ISSUED: "Émis",
  APPLIED: "Imputé",
  CANCELLED: "Annulé",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  ESPECES: "Espèces",
  CMI: "CMI",
  TRAITE: "Traite",
  AUTRE: "Autre",
};

export type LineItem = {
  kind: InvoiceItemKind;
  code?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type VatLine = { rate: number; base: number; amount: number };

export type InvoiceTotals = {
  totalTaxable: number; // somme des lignes à TVA > 0 (« Montant Taxable »)
  totalNonTaxable: number; // somme des lignes à TVA = 0 (« Montant Non Taxable » : débours, etc.)
  vatByRate: VatLine[]; // détail de la TVA par taux (20 %, 10 %, …)
  totalHT: number; // taxable + non taxable
  totalVAT: number;
  totalTTC: number;
};

/**
 * Calcule les totaux d'une facture transitaire à la marocaine.
 * Le taux de TVA est porté par chaque ligne : une ligne à 0 % va en « non taxable »
 * (débours refacturés à l'identique), une ligne > 0 % va en « taxable » et accumule
 * la TVA par taux (20 % honoraires, 10 % transport refacturé, etc.). Reproduit la
 * présentation Montant Taxable / Montant Non Taxable des factures réelles.
 */
export function totals(items: LineItem[]): InvoiceTotals {
  let totalTaxable = 0;
  let totalNonTaxable = 0;
  const byRate = new Map<number, { base: number; amount: number }>();
  for (const it of items) {
    const lineHT = round2(it.quantity * it.unitPrice);
    const rate = Number(it.vatRate) || 0;
    if (rate > 0) {
      totalTaxable += lineHT;
      const cur = byRate.get(rate) ?? { base: 0, amount: 0 };
      cur.base = round2(cur.base + lineHT);
      cur.amount = round2(cur.amount + (lineHT * rate) / 100);
      byRate.set(rate, cur);
    } else {
      totalNonTaxable += lineHT;
    }
  }
  const vatByRate: VatLine[] = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, v]) => ({ rate, base: v.base, amount: v.amount }));
  const totalVAT = round2(vatByRate.reduce((s, v) => s + v.amount, 0));
  const totalHT = round2(totalTaxable + totalNonTaxable);
  return {
    totalTaxable: round2(totalTaxable),
    totalNonTaxable: round2(totalNonTaxable),
    vatByRate,
    totalHT,
    totalVAT,
    totalTTC: round2(totalHT + totalVAT),
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMAD(n: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
  }).format(n);
}

/** Texte « x cent vingt-trois dirhams et quarante-cinq centimes » pour la facture. */
export function montantEnLettres(amount: number): string {
  // Garde-fou : un montant non fini (NaN/Infinity) ou négatif ferait boucler
  // numberToFrenchWords à l'infini (récursion → crash SSR de la facture).
  if (!Number.isFinite(amount) || amount < 0) return "—";
  const entier = Math.floor(amount);
  const cents = Math.round((amount - entier) * 100);
  const partEntiere = numberToFrenchWords(entier);
  if (cents === 0) return `${partEntiere} dirhams`;
  return `${partEntiere} dirhams et ${numberToFrenchWords(cents)} centimes`;
}

function numberToFrenchWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "zéro";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  function lessThan100(num: number): string {
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 60 || (num >= 80 && num < 100)) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (num === 80) return "quatre-vingts";
      if (unit === 0) return tens[ten];
      if (unit === 1 && ten < 8) return `${tens[ten]} et un`;
      return `${tens[ten]}-${units[unit]}`;
    }
    // 60-79
    const base = num < 80 ? 60 : 80;
    return lessThan100(base) + "-" + (num - base < 20 ? teens[num - base - 10] || lessThan100(num - base) : lessThan100(num - base));
  }

  function lessThan1000(num: number): string {
    if (num < 100) return lessThan100(num);
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    const h = hundred === 1 ? "cent" : `${units[hundred]} cent` + (rest === 0 && hundred > 1 ? "s" : "");
    return rest === 0 ? h : `${h} ${lessThan100(rest)}`;
  }

  if (n < 1000) return lessThan1000(n);
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const t = thousands === 1 ? "mille" : `${lessThan1000(thousands)} mille`;
    return rest === 0 ? t : `${t} ${lessThan1000(rest)}`;
  }
  // >= 1M
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const m = millions === 1 ? "un million" : `${lessThan1000(millions)} millions`;
  return rest === 0 ? m : `${m} ${numberToFrenchWords(rest)}`;
}
