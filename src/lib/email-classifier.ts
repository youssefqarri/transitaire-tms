import type { EmailSource } from "@/generated/prisma/enums";

const RULES: { source: EmailSource; patterns: RegExp[] }[] = [
  {
    source: "DOUANE",
    patterns: [/douane\.gov\.ma$/i, /adii\.gov\.ma$/i, /badr/i, /\bdouane\b/i, /\binspecteur\b/i],
  },
  {
    source: "PORTNET",
    patterns: [/portnet\.ma$/i, /\bportnet\b/i, /engagement d'importation/i],
  },
  {
    source: "MCI",
    patterns: [/mci\.gov\.ma$/i, /\bmci\b/i, /commerce ext[ée]rieur/i, /licence importation/i],
  },
  {
    source: "COMPAGNIE_MARITIME",
    patterns: [
      /\b(maersk|cma|cma-cgm|msc|hapag|evergreen|cosco|one|zim)\b/i,
      /connaissement/i,
      /\bbon ?à ?d[ée]livrer\b/i,
    ],
  },
];

export function classifyEmail(opts: {
  fromAddress: string;
  subject?: string | null;
  body?: string | null;
}): EmailSource {
  const haystack = `${opts.fromAddress} ${opts.subject ?? ""} ${(opts.body ?? "").slice(0, 1000)}`;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) return rule.source;
  }
  return "AUTRE";
}

// extrait numéros de DUM (8-12 chiffres) et références dossier
export function extractIdentifiers(text: string): { dums: string[]; refs: string[] } {
  const dumNumbers = new Set<string>();
  const refs = new Set<string>();
  const dumPattern = /\b(\d{8,12})\b/g;
  for (const match of text.matchAll(dumPattern)) {
    if (match[1].length >= 7) dumNumbers.add(match[1]);
  }
  const refPattern = /\b(?:r[ée]f(?:\.|érence)?\s*[:=]?\s*)([A-Z0-9\-_/]{4,20})/gi;
  for (const match of text.matchAll(refPattern)) {
    refs.add(match[1]);
  }
  return { dums: [...dumNumbers], refs: [...refs] };
}
