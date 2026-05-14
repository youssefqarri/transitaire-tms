import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  body: z.string().min(1),
  internal: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const dossier = await prisma.dossier.findFirst({ where: { OR: [{ id }, { number: id }] } });
  if (!dossier) return NextResponse.json({ error: "Dossier not found" }, { status: 404 });

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
