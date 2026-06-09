import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { authUrl } from "@/lib/gmail";
import { isInternal } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    // état OAuth = nonce aléatoire à usage unique (anti-CSRF), stocké en cookie httpOnly
    const nonce = crypto.randomBytes(16).toString("hex");
    const res = NextResponse.redirect(authUrl(nonce));
    res.cookies.set("gmail_oauth_state", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
