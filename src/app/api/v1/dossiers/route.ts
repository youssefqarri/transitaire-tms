import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import type { DossierStatus, DossierType } from "@/generated/prisma/enums";

// GET /api/v1/dossiers?q=&status=&clientId=&take=&skip=
export async function GET(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role === "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status") as DossierStatus | null;
  const type = url.searchParams.get("type") as DossierType | null;
  const clientId = url.searchParams.get("clientId");
  const take = Math.min(Number(url.searchParams.get("take") ?? 50), 200);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  const where = {
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" as const } },
        { reference: { contains: q, mode: "insensitive" as const } },
        { client: { name: { contains: q, mode: "insensitive" as const } } },
        { dums: { some: { number: { contains: q, mode: "insensitive" as const } } } },
      ],
    }),
    ...(status && { status }),
    ...(type && { type }),
    ...(clientId && { clientId }),
  };

  const [items, total] = await Promise.all([
    prisma.dossier.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, code: true } },
        supplier: { select: { id: true, name: true } },
        dums: { select: { number: true, status: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    }),
    prisma.dossier.count({ where }),
  ]);

  return NextResponse.json({ total, items });
}
