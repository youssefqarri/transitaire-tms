import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules, chiffres, tirets)"),
  ice: z.string().optional(),
  rc: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

// Crée un nouveau cabinet (Organization) + son 1er compte administrateur.
export async function POST(req: Request) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  const d = parsed.data;
  const hashed = await bcrypt.hash(d.adminPassword, 10);

  try {
    const org = await prisma.$transaction(async (tx) => {
      const o = await tx.organization.create({
        data: {
          name: d.name.trim(),
          slug: d.slug.trim().toLowerCase(),
          ice: d.ice?.trim() || null,
          rc: d.rc?.trim() || null,
          taxId: d.taxId?.trim() || null,
          address: d.address?.trim() || null,
          city: d.city?.trim() || null,
          phone: d.phone?.trim() || null,
          email: d.email?.trim() || null,
        },
      });
      await tx.user.create({
        data: {
          name: d.adminName.trim(),
          email: d.adminEmail.toLowerCase().trim(),
          password: hashed,
          role: "ADMIN",
          orgId: o.id,
        },
      });
      return o;
    });

    await audit({
      userId: session.user.id,
      action: "CREATE_ORGANIZATION",
      entity: "Organization",
      entityId: org.id,
      metadata: { slug: org.slug, admin: d.adminEmail },
      orgId: org.id,
    });
    return NextResponse.json({ id: org.id });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002")
      return NextResponse.json({ error: "Slug ou email déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
