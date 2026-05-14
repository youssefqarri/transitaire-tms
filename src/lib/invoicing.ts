import type {
  InvoiceItemKind,
  InvoiceStatus,
  PaymentMethod,
} from "@/generated/prisma/enums";

// Émetteur de la facture — pour l'instant en dur, plus tard configurable par tenant
export const ISSUER = {
  name: "Maison de Transit SARL",
  address: "Casablanca, Maroc",
  ice: "001234567000023",
  rc: "123456",
  taxId: "12345678",
  cnss: "1234567",
  phone: "+212 522 000 000",
  email: "facturation@maison-transit.ma",
  iban: "MA000000000000000000000000",
  bank: "Banque Populaire",
} as const;

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
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

/** Calcule HT, TVA, TTC à partir des lignes. */
export function totals(items: LineItem[]) {
  let totalHT = 0;
  let totalVAT = 0;
  for (const it of items) {
    const lineHT = round2(it.quantity * it.unitPrice);
    // Débours sans TVA — même si vatRate > 0
    const rate = it.kind === "DEBOURS" ? 0 : Number(it.vatRate);
    const lineVAT = round2((lineHT * rate) / 100);
    totalHT += lineHT;
    totalVAT += lineVAT;
  }
  const totalTTC = round2(totalHT + totalVAT);
  return {
    totalHT: round2(totalHT),
    totalVAT: round2(totalVAT),
    totalTTC,
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
  const entier = Math.floor(amount);
  const cents = Math.round((amount - entier) * 100);
  const partEntiere = numberToFrenchWords(entier);
  if (cents === 0) return `${partEntiere} dirhams`;
  return `${partEntiere} dirhams et ${numberToFrenchWords(cents)} centimes`;
}

function numberToFrenchWords(n: number): string {
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
