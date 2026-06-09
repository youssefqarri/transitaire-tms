import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { orgData } from "@/lib/tenant";

const schema = z.object({
  name: z.string().min(1),
  country: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx || !isInternal(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const s = await prisma.supplier.create({
    data: {
      ...orgData(ctx.orgId),
      name: parsed.data.name.trim(),
      country: parsed.data.country?.trim() || null,
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      address: parsed.data.address?.trim() || null,
    },
  });
  return NextResponse.json(s);
}
