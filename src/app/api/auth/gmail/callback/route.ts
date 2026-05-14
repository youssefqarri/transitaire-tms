import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { oauthClient } from "@/lib/gmail";
import { google } from "googleapis";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || state !== session.user.id) {
    return NextResponse.redirect(new URL("/parametres?gmail=error", req.url));
  }
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const me = await oauth2.userinfo.get();
  const emailAddress = me.data.email!;
  await prisma.emailAccount.upsert({
    where: { emailAddress },
    create: {
      userId: session.user.id,
      provider: "gmail",
      emailAddress,
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    update: {
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      active: true,
    },
  });
  return NextResponse.redirect(new URL("/emails?gmail=connected", req.url));
}
