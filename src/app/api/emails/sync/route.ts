import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { oauthClient } from "@/lib/gmail";
import { classifyEmail } from "@/lib/email-classifier";
import { linkEmailToDossiers } from "@/lib/email-linker";
import { isInternal } from "@/lib/roles";
import { decryptSecret } from "@/lib/crypto";

// POST /api/emails/sync — synchro Gmail manuelle. À déclencher périodiquement (cron) en prod.
export async function POST() {
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const accounts = await prisma.emailAccount.findMany({ where: { active: true } });
  if (accounts.length === 0)
    return NextResponse.json({ error: "Aucun compte Gmail connecté" }, { status: 400 });

  let totalImported = 0;
  let totalLinked = 0;

  for (const acc of accounts) {
    const client = oauthClient();
    client.setCredentials({
      access_token: decryptSecret(acc.accessToken),
      refresh_token: decryptSecret(acc.refreshToken),
      expiry_date: acc.tokenExpiresAt?.getTime() ?? undefined,
    });
    const gmail = google.gmail({ version: "v1", auth: client });
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
      q: "newer_than:7d",
    });
    const ids = list.data.messages?.map((m) => m.id!) ?? [];

    for (const id of ids) {
      const existing = await prisma.emailMessage.findFirst({
        where: { accountId: acc.id, externalId: id },
        select: { id: true },
      });
      if (existing) continue;
      const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
      const headers = msg.data.payload?.headers ?? [];
      const h = (n: string) => headers.find((x) => x.name?.toLowerCase() === n.toLowerCase())?.value ?? "";
      const fromRaw = h("From");
      const fromMatch = fromRaw.match(/(?:"?([^"<]+)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?/);
      const fromName = fromMatch?.[1]?.trim() || null;
      const fromAddress = fromMatch?.[2]?.trim() || fromRaw;
      const subject = h("Subject") || null;
      const to = h("To").split(",").map((s) => s.trim()).filter(Boolean);
      const cc = h("Cc").split(",").map((s) => s.trim()).filter(Boolean);
      const date = h("Date");
      const snippet = msg.data.snippet ?? null;
      const bodyText = extractBody(msg.data.payload, "text/plain");
      const bodyHtml = extractBody(msg.data.payload, "text/html");

      const source = classifyEmail({ fromAddress, subject, body: bodyText ?? snippet });

      const created = await prisma.emailMessage.create({
        data: {
          accountId: acc.id,
          externalId: id,
          threadId: msg.data.threadId ?? null,
          direction: "INCOMING",
          fromAddress,
          fromName,
          toAddresses: to,
          cc,
          subject,
          snippet,
          bodyText,
          bodyHtml,
          receivedAt: date ? new Date(date) : new Date(),
          source,
        },
      });
      totalImported++;
      const linked = await linkEmailToDossiers(created.id);
      totalLinked += linked.length;
    }
  }

  return NextResponse.json({ imported: totalImported, linked: totalLinked });
}

function extractBody(
  part: import("googleapis").gmail_v1.Schema$MessagePart | undefined,
  mime: string,
): string | null {
  if (!part) return null;
  if (part.mimeType === mime && part.body?.data) {
    return Buffer.from(part.body.data, "base64").toString("utf8");
  }
  for (const p of part.parts ?? []) {
    const r = extractBody(p, mime);
    if (r) return r;
  }
  return null;
}
