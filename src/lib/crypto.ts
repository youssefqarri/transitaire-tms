import "server-only";
import crypto from "node:crypto";

// Chiffrement AES-256-GCM des secrets au repos (SMTP/S3/OAuth Gmail).
// Clé : env ENCRYPTION_KEY = 64 caractères hex (32 octets). `openssl rand -hex 32`.
// Opt-in : SANS clé configurée → stockage en clair (rétro-compat, aucune régression).
// Le format chiffré est auto-détecté par `decryptSecret` (préfixe encv1:).

const PREFIX = "encv1:";

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY || "";
  if (hex.length < 64) return null;
  try {
    return Buffer.from(hex.slice(0, 64), "hex");
  } catch {
    return null;
  }
}

export function encryptSecret(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return plain ?? null;
  if (plain.startsWith(PREFIX)) return plain; // déjà chiffré
  const key = getKey();
  if (!key) return plain; // pas de clé → clair
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv.toString("hex"), tag.toString("hex"), ct.toString("hex")].join(":");
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // legacy en clair
  const key = getKey();
  if (!key) return value;
  try {
    const [ivH, tagH, ctH] = value.slice(PREFIX.length).split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivH, "hex"));
    decipher.setAuthTag(Buffer.from(tagH, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(ctH, "hex")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
