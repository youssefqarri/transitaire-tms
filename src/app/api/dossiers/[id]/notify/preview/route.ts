import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { loadTemplate, renderTemplate, type TemplateKey } from "@/lib/messaging";
import type { MessageChannel, MessageLang } from "@/generated/prisma/enums";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isInternal(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const templateKey = (url.searchParams.get("templateKey") || "docs_manquants") as TemplateKey;
  const channel = (url.searchParams.get("channel") || "EMAIL") as MessageChannel;
  const lang = (url.searchParams.get("lang") || "FR") as MessageLang;

  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: { client: true, dums: true },
  });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tpl = await loadTemplate(templateKey, channel, lang);
  const vars = {
    "client.name": dossier.client.name,
    "client.contactName": dossier.client.contactName ?? dossier.client.name,
    "dossier.number": dossier.number,
    "dossier.reference": dossier.reference ?? "",
    "user.name": session.user.name,
    "dum.number": dossier.dums[0]?.number ?? "",
    visitDate: dossier.visitDate
      ? new Intl.DateTimeFormat("fr-FR").format(dossier.visitDate)
      : "",
    portalUrl: process.env.AUTH_URL ?? "http://localhost:3000",
  };
  return NextResponse.json({
    subject: tpl.subject ? renderTemplate(tpl.subject, vars) : null,
    body: renderTemplate(tpl.body, vars),
  });
}
