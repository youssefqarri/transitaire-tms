import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { waListSessions, waCreateSession } from "@/lib/whatsapp";

async function guard() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) return false;
  return true;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json({ sessions: await waListSessions() });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

const createSchema = z.object({ name: z.string().min(1).max(64) });

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nom de session invalide" }, { status: 400 });
  try {
    return NextResponse.json({ session: await waCreateSession(parsed.data.name.trim()) });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
