import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  body: z.string().min(1),
  internal: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "COMMIS_DOUANE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // Scoping : un CLIENT ne peut commenter que ses propres dossiers (non clôturés ni supprimés).
  if (session.user.role === "CLIENT") {
    const owns = await prisma.dossier.findFirst({
      where: {
        id,
        clientId: session.user.clientId ?? "",
        deletedAt: null,
        status: { notIn: ["CLOTURE", "ANNULE"] },
      },
      select: { id: true },
    });
    if (!owns) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.dossierComment.create({
    data: {
      dossierId: id,
      authorId: session.user.id,
      body: parsed.data.body,
      // si client, jamais "interne"
      internal: session.user.role === "CLIENT" ? false : parsed.data.internal,
    },
  });
  return NextResponse.json(comment);
}
