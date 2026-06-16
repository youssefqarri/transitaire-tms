import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { auth } from "@/lib/auth";
import { canViewInvoices } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Génère le PDF d'une facture côté serveur (Chromium headless).
 * Rend la page d'impression /factures/[id]/imprimer en lui transmettant le cookie
 * de session de l'appelant, puis imprime en A4. Nécessite Chromium dans l'image
 * (PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium) — voir Dockerfile / SELF-HOSTING.md.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !canViewInvoices(session.user.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const internalBase = process.env.INTERNAL_APP_URL || "http://127.0.0.1:3000";
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";
  const cookie = req.headers.get("cookie") ?? "";

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    // Transmet la session de l'appelant pour que la page d'impression s'authentifie.
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.goto(`${internalBase}/factures/${id}/imprimer`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    // Si non authentifié, la page redirige vers /login : on ne renvoie pas un PDF de login.
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
        "Content-Disposition": `inline; filename="facture-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("PDF generation failed:", e);
    return NextResponse.json({ error: "Échec de la génération PDF" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
