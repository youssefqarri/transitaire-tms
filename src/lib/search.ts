import { prisma } from "@/lib/db";
import { orgScope } from "@/lib/tenant";

export type SearchItem = { id: string; title: string; sub: string; href: string };
export type SearchGroup = { type: string; label: string; total: number; items: SearchItem[] };

/**
 * Recherche universelle multi-entités (Dossiers, DUM, Factures, Clients,
 * Fournisseurs). Retourne, par groupe, les `perGroup` premiers résultats + le
 * total. Utilisée par l'API de recherche (header) et la page /recherche.
 *
 * `orgId` : isolation multi-tenant — chaque entité racine est filtrée par org.
 * Les DUM (table enfant) sont filtrées via leur dossier parent.
 */
export async function searchAll(q: string, perGroup = 5, orgId?: string | null): Promise<SearchGroup[]> {
  const ci = { contains: q, mode: "insensitive" as const };

  const dossierWhere = {
    ...orgScope(orgId),
    deletedAt: null,
    OR: [{ number: ci }, { reference: ci }, { client: { name: ci } }],
  };
  const dumWhere = { dossier: { ...orgScope(orgId), deletedAt: null }, number: ci };
  const invoiceWhere = { ...orgScope(orgId), OR: [{ number: ci }, { client: { name: ci } }] };
  const clientWhere = { ...orgScope(orgId), deletedAt: null, OR: [{ name: ci }, { code: ci }, { ice: ci }] };
  const supplierWhere = { ...orgScope(orgId), name: ci };

  const [dossiers, dossierC, dums, dumC, invoices, invoiceC, clients, clientC, suppliers, supplierC] =
    await Promise.all([
      prisma.dossier.findMany({
        where: dossierWhere,
        take: perGroup,
        orderBy: { updatedAt: "desc" },
        include: { client: { select: { name: true } } },
      }),
      prisma.dossier.count({ where: dossierWhere }),
      prisma.dUM.findMany({
        where: dumWhere,
        take: perGroup,
        include: { dossier: { select: { id: true, number: true } } },
      }),
      prisma.dUM.count({ where: dumWhere }),
      prisma.invoice.findMany({
        where: invoiceWhere,
        take: perGroup,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true } } },
      }),
      prisma.invoice.count({ where: invoiceWhere }),
      prisma.client.findMany({ where: clientWhere, take: perGroup, orderBy: { name: "asc" } }),
      prisma.client.count({ where: clientWhere }),
      prisma.supplier.findMany({ where: supplierWhere, take: perGroup, orderBy: { name: "asc" } }),
      prisma.supplier.count({ where: supplierWhere }),
    ]);

  const groups: SearchGroup[] = [
    {
      type: "dossier",
      label: "Dossiers",
      total: dossierC,
      items: dossiers.map((d) => ({
        id: d.id,
        title: d.number,
        sub: [d.client.name, d.reference].filter(Boolean).join(" • "),
        href: `/dossiers/${d.id}`,
      })),
    },
    {
      type: "dum",
      label: "DUM",
      total: dumC,
      items: dums.map((d) => ({
        id: d.id,
        title: d.number,
        sub: `Dossier ${d.dossier.number}`,
        href: `/dums/${d.id}`,
      })),
    },
    {
      type: "facture",
      label: "Factures",
      total: invoiceC,
      items: invoices.map((i) => ({
        id: i.id,
        title: i.number,
        sub: i.client.name,
        href: `/factures/${i.id}`,
      })),
    },
    {
      type: "client",
      label: "Clients",
      total: clientC,
      items: clients.map((c) => ({
        id: c.id,
        title: c.name,
        sub: [c.code, c.city].filter(Boolean).join(" • "),
        href: `/clients/${c.id}`,
      })),
    },
    {
      type: "fournisseur",
      label: "Fournisseurs",
      total: supplierC,
      items: suppliers.map((s) => ({
        id: s.id,
        title: s.name,
        sub: "",
        href: `/fournisseurs/${s.id}`,
      })),
    },
  ];

  return groups.filter((g) => g.items.length > 0);
}
