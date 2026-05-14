import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authUrl } from "@/lib/gmail";
import { isInternal } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.redirect(authUrl(session.user.id));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
