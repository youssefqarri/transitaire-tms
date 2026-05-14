import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageDriver } from "./types";

/**
 * Driver S3 — compatible AWS S3, Backblaze B2 (S3 API), Cloudflare R2, etc.
 *
 * Variables d'env requises :
 *   S3_ENDPOINT          ex: https://s3.eu-central-003.backblazeb2.com
 *   S3_REGION            ex: eu-central-003
 *   S3_BUCKET            ex: transitaire-tms-prod
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *
 * Optionnel :
 *   S3_PUBLIC_BASE_URL   si le bucket est public (CDN), on retourne l'URL publique
 *                        au lieu d'une URL signée. Sinon on signe (recommandé pour
 *                        des documents douaniers privés).
 */
export class S3Driver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl?: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Configuration S3 manquante (S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)",
      );
    }
    this.bucket = bucket;
    this.publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      // Backblaze B2 requires path-style addressing
      forcePathStyle: true,
    });
  }

  async put(
    key: string,
    body: Buffer,
    opts?: { mime?: string; filename?: string },
  ): Promise<{ key: string; url: string }> {
    const safe = sanitize(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safe,
        Body: body,
        ContentType: opts?.mime,
        ContentDisposition: opts?.filename
          ? `inline; filename="${opts.filename.replace(/"/g, "")}"`
          : undefined,
      }),
    );

    // L'URL stockée en DB est notre proxy — on ne stocke jamais une URL S3 directe
    // (permet de signer à la demande et de garder le contrôle d'accès).
    return { key: safe, url: `/api/files/${safe}` };
  }

  async get(key: string): Promise<{ body: Buffer; mime?: string } | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: sanitize(key) }),
      );
      const body = Buffer.from(await res.Body!.transformToByteArray());
      return { body, mime: res.ContentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: sanitize(key) }),
    );
  }

  async presignGet(key: string, expiresInSec = 300): Promise<string> {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, "")}/${sanitize(key)}`;
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: sanitize(key) }),
      { expiresIn: expiresInSec },
    );
  }
}

function sanitize(key: string): string {
  return key.replace(/\.\.+/g, "").replace(/^\/+/, "");
}
