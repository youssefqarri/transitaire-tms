import "server-only";
import type { StorageDriver } from "./types";
import { LocalDriver } from "./local";
import { S3Driver } from "./s3";
import { getSettings } from "../settings";

export type { StorageDriver };

/**
 * Construit le driver de stockage selon les settings (DB > .env).
 * getSettings() a son propre cache 30s donc cette fonction est cheap.
 */
export async function storage(): Promise<StorageDriver> {
  const s = await getSettings();
  if (s.storageDriver === "s3") {
    if (!s.s3Endpoint || !s.s3Region || !s.s3Bucket || !s.s3AccessKeyId || !s.s3SecretKey) {
      throw new Error("S3 non configuré (Paramètres → Stockage)");
    }
    return new S3Driver({
      endpoint: s.s3Endpoint,
      region: s.s3Region,
      bucket: s.s3Bucket,
      accessKeyId: s.s3AccessKeyId,
      secretAccessKey: s.s3SecretKey,
      publicBaseUrl: s.s3PublicBaseUrl,
    });
  }
  return new LocalDriver();
}
