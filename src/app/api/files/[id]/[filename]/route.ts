import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { getSettings } from "@/lib/settings";
import { isClientVisibleCategory } from "@/lib/statuses";
import { safeServeContentType } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "Bad" }, { status: 400 });
  }

  if (session.user.role === "CLIENT") {
    const dossier = await prisma.dossier.findFirst({
      where: { id, clientId: session.user.clientId ?? "" },
      select: { id: true },
    });
    if (!dossier) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Un client ne télécharge pas les documents internes (fiche liquidation, ticket paiement…)
    const doc = await prisma.document.findFirst({
      where: { dossierId: id, fileUrl: { contains: filename } },
      select: { category: true },
    });
    if (doc && !isClientVisibleCategory(doc.category)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const key = `${id}/${filename}`;
  const driver = await storage();
  const settings = await getSettings();

  if (settings.storageDriver === "s3") {
    const signed = await driver.presignGet(key, 300);
    return NextResponse.redirect(signed);
  }

  const obj = await driver.get(key);
  if (!obj) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(obj.body as unknown as BodyInit, {
    headers: {
      // Type neutralisé + téléchargement forcé : jamais de HTML/SVG exécuté inline (anti-XSS stocké)
      "Content-Type": safeServeContentType(obj.mime),
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
