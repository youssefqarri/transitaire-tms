import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ count: 0 });
  // non-lu = visible par l'utilisateur ET sans accusé de lecture de SA part
  const count = await prisma.notification.count({
    where: {
      read: false,
      OR: [{ userId: session.user.id }, { role: session.user.role }],
      receipts: { none: { userId: session.user.id } },
    },
  });
  return NextResponse.json({ count });
}
