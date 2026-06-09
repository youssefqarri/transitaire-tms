import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRegistry } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  ice: z.string().optional(),
  rc: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !canManageRegistry(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const data: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(parsed.data)) data[k] = (v ?? "").trim() || null;
  data.name = parsed.data.name.trim();
  try {
    const client = await prisma.client.create({ data: data as never });
    await audit({
      userId: session.user.id,
      action: "CREATE_CLIENT",
      entity: "Client",
      entityId: client.id,
    });
    return NextResponse.json(client);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
