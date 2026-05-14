import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.notification.updateMany({
    where: {
      read: false,
      OR: [{ userId: session.user.id }, { role: session.user.role }],
    },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
