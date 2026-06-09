// Validation des fichiers uploadés (back-office + portail).
// But : refuser les types dangereux (HTML/SVG/JS servis inline = XSS stocké) et
// borner la taille avant de charger le fichier en mémoire.

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 Mo

// Types acceptés pour des pièces de transit (factures, BL, certificats, photos…).
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

// Extensions explicitement bloquées même si le MIME est falsifié.
const BLOCKED_EXT = new Set<string>([
  "html", "htm", "xhtml", "svg", "js", "mjs", "cjs", "xml", "xht",
  "exe", "bat", "cmd", "sh", "com", "msi", "scr", "jar", "php", "phtml",
]);

const ALLOWED_EXT = new Set<string>([
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "tif", "tiff",
  "doc", "docx", "xls", "xlsx", "csv", "txt", "zip",
]);

export type UploadCheck = { ok: true } | { ok: false; error: string; status: number };

export function validateUpload(file: File): UploadCheck {
  if (typeof file.size === "number" && file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (max 25 Mo)", status: 413 };
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (BLOCKED_EXT.has(ext)) {
    return { ok: false, error: `Type de fichier non autorisé (.${ext})`, status: 415 };
  }
  const mime = (file.type || "").toLowerCase();
  const mimeOk = ALLOWED_MIME.has(mime) || mime === "";
  const extOk = ALLOWED_EXT.has(ext);
  if (!mimeOk && !extOk) {
    return { ok: false, error: "Type de fichier non autorisé", status: 415 };
  }
  return { ok: true };
}

// Content-Type neutralisé pour le proxy de téléchargement (jamais servir du HTML/SVG inline).
export function safeServeContentType(mime: string | null | undefined): string {
  const m = (mime || "").toLowerCase();
  if (!m || m.includes("html") || m.includes("svg") || m.includes("xml") || m.includes("javascript")) {
    return "application/octet-stream";
  }
  return m;
}
