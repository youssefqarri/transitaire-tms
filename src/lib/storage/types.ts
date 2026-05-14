/**
 * Interface de stockage de fichiers — backend abstrait.
 * Permet de switcher entre stockage local (dev) et S3-compatible (prod, Backblaze).
 *
 * Convention de clés : `<dossierId>/<filename>` (sans slash initial).
 */
export interface StorageDriver {
  /** Upload un fichier. Retourne l'URL publique ou signée à stocker en DB. */
  put(
    key: string,
    body: Buffer,
    opts?: { mime?: string; filename?: string },
  ): Promise<{ key: string; url: string }>;

  /** Récupère un fichier (pour streaming via notre proxy). */
  get(key: string): Promise<{ body: Buffer; mime?: string } | null>;

  /** Supprime un fichier. */
  delete(key: string): Promise<void>;

  /** URL signée pour téléchargement direct (expire après quelques minutes). */
  presignGet(key: string, expiresInSec?: number): Promise<string>;
}
