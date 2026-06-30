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
  const suppliers = await prisma.supplier.findMany({
    where: q
      ? { ...orgScope(ctx.orgId), name: { contains: q, mode: "insensitive" } }
      : { ...orgScope(ctx.orgId) },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ items: suppliers });
}
