import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, resolveDossierForCtx } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  body: z.string().min(1).max(5000),
  internal: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // Accès objet (CLIENT limité à ses dossiers, sinon 404 sans oracle)
  const dossier = await resolveDossierForCtx(ctx, id);
  if (!dossier) return NextResponse.json({ error: "Dossier not found" }, { status: 404 });
  // Isolation multi-tenant : le dossier doit appartenir à l'org du caller (no-op mono-tenant)
  if (ctx.orgId && dossier.orgId !== ctx.orgId)
    return NextResponse.json({ error: "Dossier not found" }, { status: 404 });

  // COMMIS_DOUANE = consultation seule
  if (ctx.role === "COMMIS_DOUANE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comment = await prisma.dossierComment.create({
    data: {
      dossierId: dossier.id,
      authorId: ctx.userId,
      body: parsed.data.body,
      internal: ctx.role === "CLIENT" ? false : parsed.data.internal,
    },
  });
  return NextResponse.json(comment);
}
