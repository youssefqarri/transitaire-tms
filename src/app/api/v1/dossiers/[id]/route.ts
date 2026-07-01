import { NextResponse } from "next/server";
import { authenticate, resolveDossierForCtx, requireApiAddon } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { orgScope } from "@/lib/tenant";
import { isClientVisibleCategory } from "@/lib/statuses";

// GET /api/v1/dossiers/:id
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  { const _deny = await requireApiAddon(ctx); if (_deny) return _deny; }

  // Accès objet (CLIENT limité à ses dossiers, sinon 404 sans oracle)
  const access = await resolveDossierForCtx(ctx, id);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isClient = ctx.role === "CLIENT";

  const dossier = await prisma.dossier.findFirst({
    where: { ...orgScope(ctx.orgId), id: access.id },
    include: {
      // Un CLIENT ne voit que des coordonnées limitées (pas ICE/RC/IF/notes du portefeuille)
      client: isClient
        ? { select: { id: true, name: true, city: true, email: true, phone: true } }
        : true,
      supplier: true,
      createdBy: { select: isClient ? { id: true, name: true } : { id: true, name: true, email: true } },
      assignedTo: { select: isClient ? { id: true, name: true } : { id: true, name: true, email: true } },
      dums: true,
      documents: {
        where: { deletedAt: null },
        orderBy: { receivedAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
      statusChanges: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
      // Un CLIENT ne voit JAMAIS les commentaires internes
      comments: {
        where: isClient ? { internal: false } : undefined,
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Pour un CLIENT, masquer les documents internes (fiche liquidation, ticket paiement…)
  if (isClient) {
    dossier.documents = dossier.documents.filter((d) => isClientVisibleCategory(d.category));
  }

  return NextResponse.json(dossier);
}
