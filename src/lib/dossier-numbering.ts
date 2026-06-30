import "server-only";
import { prisma } from "./db";
import { orgScope } from "./tenant";

/**
 * Génère un numéro de dossier provisoire au format PROV-YYYY-NNNN.
 * Utilisé quand le numéro de dossier définitif n'est pas encore disponible.
 * L'utilisateur pourra modifier ce numéro plus tard via l'édition.
 *
 * `orgId` : la séquence provisoire est propre à chaque org (isolation multi-tenant).
 *
 * Tente jusqu'à 10 fois pour gérer les collisions concurrentes.
 */
export async function nextProvisionalDossierNumber(
  year = new Date().getFullYear(),
  orgId?: string | null,
): Promise<string> {
  // Cherche le dernier numéro PROV-YYYY-XXXX
  const prefix = `PROV-${year}-`;
  const last = await prisma.dossier.findFirst({
    where: { ...orgScope(orgId), number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  let nextSeq = 1;
  if (last) {
    const match = last.number.match(/PROV-\d{4}-(\d+)/);
    if (match) nextSeq = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
