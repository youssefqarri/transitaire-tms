import "server-only";
import puppeteer from "puppeteer-core";

// Rend en PDF la page d'impression d'une facture d'abonnement (Chromium headless).
// `cookie` = cookie de session de l'appelant (la page /imprimer exige un admin
// plateforme authentifié). Renvoie null si le rendu échoue (jamais d'exception
// propagée aux appelants d'envoi — l'email/WhatsApp partiront sans PJ le cas échéant).
export async function renderSubscriptionInvoicePdf(
  id: string,
  cookie: string,
): Promise<Buffer | null> {
  const internalBase = process.env.INTERNAL_APP_URL || "http://127.0.0.1:3000";
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

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
    if (page.url().includes("/login")) return null;
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } catch (e) {
    console.error("renderSubscriptionInvoicePdf failed:", e);
    return null;
  } finally {
    await browser?.close();
  }
}
