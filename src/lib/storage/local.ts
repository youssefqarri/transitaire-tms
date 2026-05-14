import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "./types";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/** Stocke les fichiers dans le filesystem local. Bon pour le dev. */
export class LocalDriver implements StorageDriver {
  async put(key: string, body: Buffer): Promise<{ key: string; url: string }> {
    const safe = sanitize(key);
    const full = path.join(UPLOAD_DIR, safe);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    return { key: safe, url: `/api/files/${safe}` };
  }

  async get(key: string): Promise<{ body: Buffer } | null> {
    const safe = sanitize(key);
    try {
      const body = await readFile(path.join(UPLOAD_DIR, safe));
      return { body };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const safe = sanitize(key);
    try {
      await unlink(path.join(UPLOAD_DIR, safe));
    } catch {
      /* ignore */
    }
  }

  async presignGet(key: string): Promise<string> {
    // Pas de signature en local — on passe par notre proxy
    return `/api/files/${sanitize(key)}`;
  }
}

function sanitize(key: string): string {
  // empêche les path traversal
  return key.replace(/\.\.+/g, "").replace(/^\/+/, "");
}
