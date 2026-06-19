import "server-only";
import { getSettings } from "./settings";

/**
 * Normalise un numéro (marocain par défaut) en chatId WhatsApp `2126XXXXXXXX@c.us`.
 * - retire espaces, +, tirets ; gère 00 / 0 initial.
 * - les numéros déjà internationaux (autre indicatif) sont conservés tels quels.
 */
export function toChatId(phone: string): string {
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("0")) p = "212" + p.slice(1);
  else if (!p.startsWith("212") && p.length <= 9) p = "212" + p;
  return `${p}@c.us`;
}

type WaConfig = { url: string; key: string; session: string };

async function getWaConfig(): Promise<WaConfig | null> {
  const s = await getSettings();
  if (!s.waApiUrl || !s.waApiKey) return null;
  return {
    url: s.waApiUrl.replace(/\/+$/, ""),
    key: s.waApiKey,
    session: s.waSession || "default",
  };
}

export async function isWhatsAppConfigured(): Promise<boolean> {
  return (await getWaConfig()) !== null;
}

/** Envoie un message texte WhatsApp via l'API OpenWA/WAHA (POST send-text). */
export async function sendWhatsApp(opts: {
  to: string;
  text: string;
}): Promise<{ messageId: string }> {
  const cfg = await getWaConfig();
  if (!cfg) throw new Error("WhatsApp non configuré (Paramètres → WhatsApp)");
  const chatId = opts.to.includes("@") ? opts.to : toChatId(opts.to);

  const res = await fetch(
    `${cfg.url}/api/sessions/${encodeURIComponent(cfg.session)}/messages/send-text`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": cfg.key },
      body: JSON.stringify({ chatId, text: opts.text }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`WhatsApp API ${res.status} — ${detail.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    id?: string | { _serialized?: string };
    key?: { id?: string };
  };
  const messageId =
    typeof data.id === "string"
      ? data.id
      : data.id?._serialized ?? data.key?.id ?? "sent";
  return { messageId };
}

/** Vérifie l'état de la session WhatsApp (pour le test de configuration). */
export async function verifyWhatsApp(): Promise<{
  ok: boolean;
  status?: string;
  error?: string;
}> {
  const cfg = await getWaConfig();
  if (!cfg) return { ok: false, error: "WhatsApp non configuré" };
  try {
    const res = await fetch(
      `${cfg.url}/api/sessions/${encodeURIComponent(cfg.session)}`,
      { headers: { "X-API-Key": cfg.key }, signal: AbortSignal.timeout(12_000) },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `API ${res.status} — ${detail.slice(0, 160)}` };
    }
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      state?: string;
    };
    const status = String(data.status ?? data.state ?? "?");
    // WAHA: "WORKING" = prêt ; open-wa: "CONNECTED"/"AUTHENTICATED".
    const ok = ["WORKING", "CONNECTED", "AUTHENTICATED"].includes(status.toUpperCase());
    return { ok, status };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Gestion des sessions (création, QR, start/stop) ─────────────
export type WaSession = {
  id: string;
  name: string;
  status: string;
  phone?: string | null;
  pushName?: string | null;
  lastError?: string | null;
};

async function waRequest(path: string, init?: RequestInit): Promise<Response> {
  const cfg = await getWaConfig();
  if (!cfg) throw new Error("WhatsApp non configuré (URL + clé requises)");
  return fetch(`${cfg.url}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-API-Key": cfg.key, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
}

async function waThrow(res: Response): Promise<never> {
  const detail = await res.text().catch(() => "");
  throw new Error(`API ${res.status} — ${detail.slice(0, 180)}`);
}

export async function waListSessions(): Promise<WaSession[]> {
  const res = await waRequest("/api/sessions");
  if (!res.ok) return waThrow(res);
  const data = (await res.json().catch(() => [])) as WaSession[];
  return Array.isArray(data) ? data : [];
}

export async function waCreateSession(name: string): Promise<WaSession> {
  const res = await waRequest("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return waThrow(res);
  return (await res.json()) as WaSession;
}

export async function waSessionAction(id: string, action: "start" | "stop"): Promise<void> {
  const res = await waRequest(`/api/sessions/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
  });
  if (!res.ok) return waThrow(res);
}

export async function waDeleteSession(id: string): Promise<void> {
  const res = await waRequest(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) return waThrow(res);
}

export async function waGetQr(id: string): Promise<{ qrCode: string | null; status: string }> {
  const res = await waRequest(`/api/sessions/${encodeURIComponent(id)}/qr`);
  if (!res.ok) return waThrow(res);
  const d = (await res.json().catch(() => ({}))) as { qrCode?: string; status?: string };
  return { qrCode: d.qrCode ?? null, status: d.status ?? "?" };
}
