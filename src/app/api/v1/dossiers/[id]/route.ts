import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/dossiers/:id
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // accepte aussi un numéro (D-XXXX) en plus de l'id cuid
  const dossier = await prisma.dossier.findFirst({
    where: { OR: [{ id }, { number: id }] },
    include: {
      client: true,
      supplier: true,
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      dums: true,
      documents: {
        orderBy: { receivedAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
      statusChanges: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ACL : client ne voit que ses dossiers
  if (ctx.role === "CLIENT" && dossier.clientId !== ctx.clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(dossier);
}
