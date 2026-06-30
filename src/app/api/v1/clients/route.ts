import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { orgScope } from "@/lib/tenant";

export async function GET(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx || !isInternal(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const clients = await prisma.client.findMany({
    where: q
      ? {
          ...orgScope(ctx.orgId),
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { ice: { contains: q, mode: "insensitive" } },
          ],
        }
      : { ...orgScope(ctx.orgId), deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { dossiers: true } } },
    take: 200,
  });
  return NextResponse.json({ items: clients });
}
