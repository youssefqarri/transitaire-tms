import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { storage } from "@/lib/storage";
import { S3Driver } from "@/lib/storage/s3";
import { getSettings } from "@/lib/settings";

// Rejette les hôtes privés/loopback/métadonnées cloud (anti-SSRF basique)
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "::1") return true;
  if (h === "169.254.169.254" || h === "metadata.google.internal") return true;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}

/**
 * POST /api/settings/test-storage
 * - Si driver=local : test trivial (PUT/GET/DELETE sur un fichier jetable)
 * - Si driver=s3 : utilise S3Driver.testConnection()
 */
export async function POST() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await getSettings();

  if (settings.storageDriver === "s3") {
    if (
      !settings.s3Endpoint ||
      !settings.s3Region ||
      !settings.s3Bucket ||
      !settings.s3AccessKeyId ||
      !settings.s3SecretKey
    ) {
      return NextResponse.json({
        ok: false,
        error: "Configuration S3 incomplète",
      });
    }
    let s3Host = "";
    try {
      s3Host = new URL(settings.s3Endpoint).hostname;
    } catch {
      return NextResponse.json({ ok: false, error: "Endpoint S3 invalide (URL https attendue)" });
    }
    if (!settings.s3Endpoint.startsWith("https://") || isPrivateHost(s3Host)) {
      return NextResponse.json({
        ok: false,
        error: "Endpoint S3 refusé : une URL https vers un hôte public est requise.",
      });
    }
    const driver = new S3Driver({
      endpoint: settings.s3Endpoint,
      region: settings.s3Region,
      bucket: settings.s3Bucket,
      accessKeyId: settings.s3AccessKeyId,
      secretAccessKey: settings.s3SecretKey,
      publicBaseUrl: settings.s3PublicBaseUrl,
    });
    const result = await driver.testConnection();
    return NextResponse.json(result);
  }

  // local : test PUT/GET/DELETE
  try {
    const driver = await storage();
    const key = `__test/${Date.now()}.txt`;
    await driver.put(key, Buffer.from("ok"), { mime: "text/plain" });
    const got = await driver.get(key);
    await driver.delete(key);
    if (!got) return NextResponse.json({ ok: false, error: "GET retourne null" });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
