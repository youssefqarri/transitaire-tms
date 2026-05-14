import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { storage } from "@/lib/storage";
import { S3Driver } from "@/lib/storage/s3";
import { getSettings } from "@/lib/settings";

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
