import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Génère le PDF d'une facture d'abonnement (Chromium headless). Rend la page
// /admin/subscription-invoices/[id]/imprimer avec le cookie de session de l'appelant.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !isPlatformAdmin(session.user.email))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inv = await prisma.subscriptionInvoice.findUnique({ where: { id }, select: { number: true } });
  if (!inv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const internalBase = process.env.INTERNAL_APP_URL || "http://127.0.0.1:3000";
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";
  const cookie = req.headers.get("cookie") ?? "";

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-breakpad"],
    });
    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.goto(`${internalBase}/admin/subscription-invoices/${id}/imprimer`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    if (page.url().includes("/login")) {
      return NextResponse.json({ error: "Rendu non authentifié" }, { status: 401 });
    }
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${inv.number ?? id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Subscription invoice PDF failed:", e);
    return NextResponse.json({ error: "Échec de la génération PDF" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
