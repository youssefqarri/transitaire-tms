import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { oauthClient } from "@/lib/gmail";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { encryptSecret } from "@/lib/crypto";
import { orgData } from "@/lib/tenant";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  // Anti-CSRF : l'état doit correspondre au nonce posé en cookie par /start
  const cookieState = req.headers.get("cookie")?.match(/gmail_oauth_state=([a-f0-9]+)/)?.[1];
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/parametres?gmail=error", req.url));
  }

  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const me = await oauth2.userinfo.get();
  const emailAddress = me.data.email!;

  // Tokens OAuth chiffrés au repos (opt-in ENCRYPTION_KEY)
  await prisma.emailAccount.upsert({
    where: { emailAddress },
    create: {
      ...orgData(session.user.orgId),
      userId: session.user.id,
      provider: "gmail",
      emailAddress,
      accessToken: encryptSecret(tokens.access_token ?? null),
      refreshToken: encryptSecret(tokens.refresh_token ?? null),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    update: {
      accessToken: encryptSecret(tokens.access_token ?? null),
      refreshToken: encryptSecret(tokens.refresh_token ?? null),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      active: true,
    },
  });

  const res = NextResponse.redirect(new URL("/emails?gmail=connected", req.url));
  res.cookies.set("gmail_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
