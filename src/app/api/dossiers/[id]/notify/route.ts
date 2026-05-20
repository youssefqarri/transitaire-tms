import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canNotifyClient } from "@/lib/roles";
import { notifyClient } from "@/lib/messaging-server";
import { audit } from "@/lib/audit";
import type { TemplateKey } from "@/lib/messaging";

const schema = z.object({
  templateKey: z.string().min(1),
  channel: z.enum(["EMAIL", "WHATSAPP"]),
  lang: z.enum(["FR", "AR", "EN"]).default("FR"),
  customSubject: z.string().optional(),
  customBody: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canNotifyClient(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const result = await notifyClient({
    dossierId: id,
    templateKey: parsed.data.templateKey as TemplateKey,
    channel: parsed.data.channel,
    lang: parsed.data.lang,
    userId: session.user.id,
    customSubject: parsed.data.customSubject,
    customBody: parsed.data.customBody,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await audit({
    userId: session.user.id,
    action: "NOTIFY_CLIENT",
    entity: "Dossier",
    entityId: id,
    metadata: {
      templateKey: parsed.data.templateKey,
      channel: parsed.data.channel,
    },
  });

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
