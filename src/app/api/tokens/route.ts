import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { generateApiToken } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const schema = z.object({
  label: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tokens = await prisma.apiToken.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  return NextResponse.json({ items: tokens });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { raw, prefix } = generateApiToken();
  const tokenHash = await bcrypt.hash(raw, 10);

  const token = await prisma.apiToken.create({
    data: {
      label: parsed.data.label.trim(),
      tokenHash,
      prefix,
      userId: parsed.data.userId,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  await audit({
    userId: session.user.id,
    action: "CREATE_API_TOKEN",
    entity: "ApiToken",
    entityId: token.id,
    metadata: { label: token.label, userId: parsed.data.userId },
  });

  // Le token brut n'est renvoyé QUE cette unique fois
  return NextResponse.json({ id: token.id, token: raw, prefix });
}
