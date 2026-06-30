import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { orgData } from "@/lib/tenant";

const schema = z.object({
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  lang: z.enum(["FR", "AR", "EN"]).default("FR"),
  subject: z.string().nullable().optional(),
  body: z.string().min(1),
  active: z.boolean().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const data = parsed.data;
  const tpl = await prisma.messageTemplate.upsert({
    where: {
      key_channel_lang: { key, channel: data.channel, lang: data.lang },
    },
    update: {
      subject: data.subject ?? null,
      body: data.body,
      active: data.active,
      deletedAt: null, // recréer un template "supprimé" le restaure
    },
    create: {
      ...orgData(session.user.orgId),
      key,
      channel: data.channel,
      lang: data.lang,
      subject: data.subject ?? null,
      body: data.body,
      active: data.active,
    },
  });

  await audit({
    userId: session.user.id,
    action: "UPDATE_TEMPLATE",
    entity: "MessageTemplate",
    entityId: tpl.id,
    metadata: { key, channel: data.channel, lang: data.lang },
  });
  return NextResponse.json(tpl);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const channel = url.searchParams.get("channel");
  const lang = url.searchParams.get("lang") ?? "FR";
  if (channel !== "EMAIL" && channel !== "WHATSAPP")
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  if (lang !== "FR" && lang !== "AR" && lang !== "EN")
    return NextResponse.json({ error: "Invalid lang" }, { status: 400 });

  // soft-delete (l'app retombera sur le template par défaut)
  await prisma.messageTemplate.updateMany({
    where: { key, channel, lang, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await audit({
    userId: session.user.id,
    action: "SOFT_DELETE_TEMPLATE",
    entity: "MessageTemplate",
    metadata: { key, channel, lang },
  });
  return NextResponse.json({ ok: true });
}
