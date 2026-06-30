import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

const schema = z.object({ active: z.boolean() });

// Suspend / réactive un cabinet. Un cabinet suspendu (active=false) bloque la
// connexion de tous ses utilisateurs (cf. revalidation JWT dans auth.ts).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 });

  const org = await prisma.organization.update({
    where: { id },
    data: { active: parsed.data.active },
    select: { id: true, active: true, slug: true },
  });

  await audit({
    userId: session.user.id,
    action: parsed.data.active ? "ACTIVATE_ORG" : "SUSPEND_ORG",
    entity: "Organization",
    entityId: id,
    metadata: { slug: org.slug },
    orgId: id,
  });
  return NextResponse.json(org);
}
