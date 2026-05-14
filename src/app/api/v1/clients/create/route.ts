import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
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
  const ctx = await authenticate(req);
  if (!ctx || !isInternal(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  try {
    const client = await prisma.client.create({
      data: {
        name: parsed.data.name.trim(),
        code: parsed.data.code?.trim() || null,
        ice: parsed.data.ice?.trim() || null,
        rc: parsed.data.rc?.trim() || null,
        taxId: parsed.data.taxId?.trim() || null,
        email: parsed.data.email?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        city: parsed.data.city?.trim() || null,
        address: parsed.data.address?.trim() || null,
        contactName: parsed.data.contactName?.trim() || null,
        notes: parsed.data.notes || null,
      },
    });
    await audit({
      userId: ctx.userId,
      action: "CREATE_CLIENT",
      entity: "Client",
      entityId: client.id,
      metadata: { via: ctx.via },
    });
    return NextResponse.json(client);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Code client déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
