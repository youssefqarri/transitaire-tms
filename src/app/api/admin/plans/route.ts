import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";

const schema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  period: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  maxSeats: z.number().int().positive().nullable().optional(),
  maxDossiersPerMonth: z.number().int().positive().nullable().optional(),
  maxStorageGb: z.number().int().positive().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  const d = parsed.data;
  const plan = await prisma.plan.create({
    data: {
      name: d.name.trim(),
      price: d.price,
      period: d.period,
      maxSeats: d.maxSeats ?? null,
      maxDossiersPerMonth: d.maxDossiersPerMonth ?? null,
      maxStorageGb: d.maxStorageGb ?? null,
    },
  });
  return NextResponse.json({ id: plan.id });
}
