import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { audit } from "@/lib/audit";

const schema = z.object({
  planId: z.string().nullable().optional(),
  status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"]).optional(),
  currentPeriodEnd: z.string().nullable().optional(), // ISO yyyy-mm-dd
  graceUntil: z.string().nullable().optional(), // rallonge exceptionnelle (ISO yyyy-mm-dd)
  addons: z.array(z.string()).optional(),
});

// Convertit "yyyy-mm-dd" | null | undefined en Date | null | undefined (pour un update conditionnel).
function toDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  return v ? new Date(v) : null;
}

// Gère l'abonnement d'un cabinet : plan, statut, échéance. Le statut SUSPENDED/CANCELLED
// coupe l'accès (reflété sur Organization.active, gate de la revalidation JWT).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 });
  const d = parsed.data;
  const periodEnd = toDate(d.currentPeriodEnd);
  const graceUntil = toDate(d.graceUntil);

  // Les add-ons inclus d'office dans le forfait sont toujours actifs : on les
  // fusionne dans les add-ons effectifs (l'enforcement lit `addons`).
  let effectiveAddons = d.addons;
  if (d.addons !== undefined && d.planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: d.planId },
      select: { includedAddons: true },
    });
    effectiveAddons = [...new Set([...(plan?.includedAddons ?? []), ...d.addons])];
  }

  const sub = await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      planId: d.planId ?? null,
      status: d.status ?? "TRIAL",
      currentPeriodEnd: periodEnd ?? null,
      graceUntil: graceUntil ?? null,
      addons: effectiveAddons ?? [],
    },
    update: {
      ...(d.planId !== undefined ? { planId: d.planId } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(periodEnd !== undefined ? { currentPeriodEnd: periodEnd } : {}),
      ...(graceUntil !== undefined ? { graceUntil } : {}),
      ...(effectiveAddons !== undefined ? { addons: effectiveAddons } : {}),
    },
  });

  // Refléter le blocage sur Organization.active (gate auth) quand le statut change.
  if (d.status !== undefined) {
    const blocked = d.status === "SUSPENDED" || d.status === "CANCELLED";
    await prisma.organization.update({ where: { id: orgId }, data: { active: !blocked } });
  }

  await audit({
    userId: session.user.id,
    action: "UPDATE_SUBSCRIPTION",
    entity: "Subscription",
    entityId: sub.id,
    metadata: { orgId, status: d.status, planId: d.planId },
    orgId,
  });
  return NextResponse.json(sub);
}
