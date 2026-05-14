import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";

const schema = z.object({
  name: z.string().min(1),
  country: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const data: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(parsed.data)) data[k] = (v ?? "").trim() || null;
  data.name = parsed.data.name.trim();
  const s = await prisma.supplier.create({ data: data as never });
  return NextResponse.json(s);
}
