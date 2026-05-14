import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { audit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    "ADMIN",
    "EXPLOITATION",
    "DECLARANT",
    "COMMIS_DOUANE",
    "BUREAU",
    "COMPTABILITE",
    "CLIENT",
  ]),
  clientId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  try {
    const u = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email: parsed.data.email.toLowerCase().trim(),
        password: hashed,
        role: parsed.data.role,
        clientId: parsed.data.role === "CLIENT" ? parsed.data.clientId : null,
      },
    });
    await audit({
      userId: session.user.id,
      action: "CREATE_USER",
      entity: "User",
      entityId: u.id,
      metadata: { role: u.role },
    });
    return NextResponse.json({ id: u.id });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002")
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
