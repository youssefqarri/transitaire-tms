import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageDriver } from "./types";

/**
 * Driver S3 — compatible AWS S3, Backblaze B2 (S3 API), Cloudflare R2.
 * Les credentials sont passés en constructeur (lus depuis lib/settings).
 */
export class S3Driver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl?: string;

  constructor(config: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBaseUrl?: string | null;
  }) {
    this.bucket = config.bucket;
    this.publicBaseUrl = config.publicBaseUrl ?? undefined;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Backblaze B2 requirement
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
    // Toujours une URL signée à expiration courte : les pièces de transit sont
    // sensibles et l'accès est déjà contrôlé par /api/files (ACL clientId).
    // (publicBaseUrl volontairement non utilisé ici — il exposait une URL publique
    //  non expirante qui contournait l'ACL.)
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: sanitize(key) }),
      { expiresIn: expiresInSec },
    );
  }

  /** Test rapide : tente un PUT + DELETE sur une clé jetable. */
  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    const key = `__connectivity_test/${Date.now()}.txt`;
    try {
      await this.put(key, Buffer.from("ok"), { mime: "text/plain" });
      await this.delete(key);
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message };
    }
  }
}

function sanitize(key: string): string {
  return key.replace(/\.\.+/g, "").replace(/^\/+/, "");
}
