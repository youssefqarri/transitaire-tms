import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orgScope } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ count: 0 });
  const count = await prisma.notification.count({
    where: {
      ...orgScope(session.user.orgId),
      read: false,
      OR: [{ userId: session.user.id }, { role: session.user.role }],
    },
  });
  return NextResponse.json({ count });
}
