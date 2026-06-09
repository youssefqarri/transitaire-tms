import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Pose un accusé de lecture pour CET utilisateur sur ses notifications non lues
  const notifs = await prisma.notification.findMany({
    where: {
      read: false,
      OR: [{ userId: session.user.id }, { role: session.user.role }],
      receipts: { none: { userId: session.user.id } },
    },
    select: { id: true },
  });
  if (notifs.length) {
    await prisma.notificationReceipt.createMany({
      data: notifs.map((n) => ({ notificationId: n.id, userId: session.user.id })),
      skipDuplicates: true,
    });
  }
  return NextResponse.json({ ok: true });
}
