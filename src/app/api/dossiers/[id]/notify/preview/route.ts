import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isInternal } from "@/lib/roles";
import { orgScope } from "@/lib/tenant";
import { loadTemplate, renderTemplate, type TemplateKey } from "@/lib/messaging";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
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

  const dossier = await prisma.dossier.findFirst({
    where: { id, ...orgScope(session.user.orgId) },
    include: {
      client: true,
      dums: true,
      expectedDocuments: { where: { deletedAt: null, fulfilledAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tpl = await loadTemplate(templateKey, channel, lang);
  // Mêmes variables que l'envoi réel (notifyClient) — sinon l'aperçu (qui devient le
  // customBody envoyé) perdrait la liste des documents et les références.
  const refParts: string[] = [];
  if (dossier.reference) refParts.push(`réf. ${dossier.reference}`);
  if (dossier.clientReference && dossier.clientReference !== dossier.reference)
    refParts.push(`votre réf. ${dossier.clientReference}`);
  const vars = {
    "client.name": dossier.client.name,
    "client.contactName": dossier.client.contactName ?? dossier.client.name,
    "dossier.number": dossier.number,
    "dossier.reference": dossier.reference ?? "",
    "dossier.clientReference": dossier.clientReference ?? "",
    "dossier.refSuffix": refParts.length ? ` (${refParts.join(" — ")})` : "",
    "user.name": session.user.name,
    "dum.number": dossier.dums[0]?.number ?? "",
    visitDate: dossier.visitDate
      ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca" }).format(dossier.visitDate)
      : "",
    missingList: dossier.expectedDocuments.length
      ? dossier.expectedDocuments
          .map((e) => `- ${e.name?.trim() || e.note?.trim() || DOCUMENT_CATEGORY_LABELS[e.category]}`)
          .join("\n")
      : "- (à préciser)",
    portalUrl: process.env.AUTH_URL ?? "http://localhost:3000",
  };
  return NextResponse.json({
    subject: tpl.subject ? renderTemplate(tpl.subject, vars) : null,
    body: renderTemplate(tpl.body, vars),
  });
}
