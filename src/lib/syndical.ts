// Tarif syndical des honoraires des transitaires agréés en douane du Maroc
// (ARTICLE 3 — IMPORTATIONS). Honoraire de base = taux de la tranche × valeur en
// douane + montant fixe (barème continu), avec un plancher (minimum de perception).
// Source : grille officielle transmise par la cliente (Transit Multiservices).

export const SYNDICAL_MIN_PERCEPTION = 75;

export type SyndicalBracket = { upTo: number; rate: number; fixed: number };

export const SYNDICAL_BRACKETS: SyndicalBracket[] = [
  { upTo: 10_000, rate: 0.02, fixed: 25 },
  { upTo: 30_000, rate: 0.015, fixed: 75 },
  { upTo: 50_000, rate: 0.01, fixed: 225 },
  { upTo: 100_000, rate: 0.0075, fixed: 350 },
  { upTo: 200_000, rate: 0.005, fixed: 600 },
  { upTo: Infinity, rate: 0.004, fixed: 800 },
];

/** Honoraire de base selon la valeur en douane (DH), plancher = minimum de perception. */
export function syndicalBaseTariff(customsValue: number): number {
  if (!(customsValue > 0)) return SYNDICAL_MIN_PERCEPTION;
  const bracket =
    SYNDICAL_BRACKETS.find((b) => customsValue <= b.upTo) ??
    SYNDICAL_BRACKETS[SYNDICAL_BRACKETS.length - 1];
  return Math.max(SYNDICAL_MIN_PERCEPTION, customsValue * bracket.rate + bracket.fixed);
}

/** Supplément « feuillet » selon le nombre d'articles : >4 → +25 %, >8 → +50 %, >12 → ×2. */
export function articleMultiplier(articleCount: number): number {
  if (articleCount > 12) return 2;
  if (articleCount > 8) return 1.5;
  if (articleCount > 4) return 1.25;
  return 1;
}

export type SyndicalResult = {
  base: number; // honoraire de base (tranche)
  multiplier: number; // coefficient feuillet (1 / 1.25 / 1.5 / 2)
  afterArticles: number; // base × coefficient
  reductionPct: number; // réduction appliquée
  net: number; // honoraire net après réduction
};

/** Calcule l'honoraire net : (base × coefficient feuillet) − réduction. */
export function computeSyndicalHonoraire(opts: {
  customsValue: number;
  articleCount?: number;
  reductionPct?: number;
}): SyndicalResult {
  const base = syndicalBaseTariff(opts.customsValue);
  const multiplier = articleMultiplier(opts.articleCount ?? 1);
  const afterArticles = base * multiplier;
  const reductionPct = Math.min(Math.max(opts.reductionPct ?? 0, 0), 100);
  const net = afterArticles * (1 - reductionPct / 100);
  return {
    base: round2(base),
    multiplier,
    afterArticles: round2(afterArticles),
    reductionPct,
    net: round2(net),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
