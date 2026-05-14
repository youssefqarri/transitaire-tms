import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    userId: ctx.userId,
    email: ctx.email,
    name: ctx.name,
    role: ctx.role,
    clientId: ctx.clientId,
    via: ctx.via,
  });
}
