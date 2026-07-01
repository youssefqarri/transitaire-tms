import { NextResponse } from "next/server";
import { authenticate, requireApiAddon } from "@/lib/api-auth";

export async function GET(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  { const _deny = await requireApiAddon(ctx); if (_deny) return _deny; }
  return NextResponse.json({
    userId: ctx.userId,
    email: ctx.email,
    name: ctx.name,
    role: ctx.role,
    clientId: ctx.clientId,
    via: ctx.via,
  });
}
