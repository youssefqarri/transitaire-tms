"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Plus, Play, Square, Trash2, QrCode, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Session = {
  id: string;
  name: string;
  status: string;
  phone?: string | null;
  pushName?: string | null;
  lastError?: string | null;
};

const CONNECTED = ["ready", "working", "connected", "authenticated"];
function tone(status: string): "ok" | "warn" | "danger" | "neutral" {
  const s = status.toLowerCase();
  if (CONNECTED.includes(s)) return "ok";
  if (s.includes("qr") || s.includes("scan") || s.includes("starting") || s.includes("pairing")) return "warn";
  if (s.includes("fail") || s.includes("error")) return "danger";
  return "neutral";
}

export function WhatsAppSessionsManager({ configured }: { configured: boolean }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();
  const [qrFor, setQrFor] = useState<Session | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/whatsapp/sessions");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || `Erreur (${res.status})`);
        setSessions([]);
        return;
      }
      setLoadError(null);
      setSessions(data.sessions ?? []);
    } catch {
      setLoadError("Impossible de joindre le serveur");
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (configured) refresh();
    else setSessions([]);
  }, [configured, refresh]);

  function create() {
    if (!newName.trim()) return;
    start(async () => {
      const res = await fetch("/api/settings/whatsapp/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Échec création");
        return;
      }
      toast.success(`Session « ${newName.trim()} » créée`);
      setNewName("");
      await refresh();
      if (data.session) setQrFor(data.session);
    });
  }

  function action(s: Session, act: "start" | "stop") {
    start(async () => {
      const res = await fetch(`/api/settings/whatsapp/sessions/${encodeURIComponent(s.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(act === "start" ? "Session démarrée" : "Session arrêtée");
      await refresh();
    });
  }

  function remove(s: Session) {
    if (!confirm(`Supprimer la session « ${s.name} » ?`)) return;
    start(async () => {
      const res = await fetch(`/api/settings/whatsapp/sessions/${encodeURIComponent(s.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Session supprimée");
      if (qrFor?.id === s.id) setQrFor(null);
      await refresh();
    });
  }

  if (!configured) {
    return (
      <p className="text-[12.5px] text-[var(--color-fg-3)]">
        Enregistrez d&apos;abord l&apos;URL et la clé API ci-dessus pour gérer les sessions.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[14px] font-semibold">Sessions WhatsApp</div>
        <Button variant="outline" size="sm" onClick={() => refresh()} disabled={pending}>
          <RefreshCw className={pending ? "animate-spin" : ""} /> Rafraîchir
        </Button>
      </div>

      {loadError && (
        <div className="rounded-[var(--radius)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-2.5 text-[12px] text-[var(--color-danger)] font-mono">
          {loadError}
        </div>
      )}

      <div className="border border-[var(--color-border)] rounded-[var(--radius)] divide-y divide-[var(--color-border)]">
        {sessions === null ? (
          <div className="p-4 text-[12.5px] text-[var(--color-fg-3)]">Chargement…</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-[12.5px] text-[var(--color-fg-3)]">
            {loadError ? "—" : "Aucune session. Créez-en une ci-dessous."}
          </div>
        ) : (
          sessions.map((s) => {
            const connected = CONNECTED.includes(s.status.toLowerCase());
            return (
              <div key={s.id} className="px-3.5 py-2.5 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--color-fg)]">{s.name}</span>
                    <Badge tone={tone(s.status)}>{s.status}</Badge>
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                    {s.phone ? `${s.phone}` : "non connecté"}
                    {s.pushName ? ` · ${s.pushName}` : ""}
                    {s.lastError ? ` · ${s.lastError.slice(0, 60)}` : ""}
                  </div>
                </div>
                {!connected && (
                  <Button variant="outline" size="sm" onClick={() => setQrFor(s)}>
                    <QrCode /> QR
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => action(s, connected ? "stop" : "start")}
                  disabled={pending}
                  aria-label={connected ? "Arrêter" : "Démarrer"}
                >
                  {connected ? <Square /> : <Play />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(s)}
                  disabled={pending}
                  aria-label="Supprimer"
                >
                  <Trash2 className="text-[var(--color-fg-mute)]" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom de la session (ex. default)"
          className="font-mono"
        />
        <Button size="sm" onClick={create} disabled={pending || !newName.trim()}>
          <Plus /> Créer
        </Button>
      </div>

      {qrFor && <QrDialog session={qrFor} onClose={() => setQrFor(null)} onConnected={refresh} />}
    </div>
  );
}

function QrDialog({
  session,
  onClose,
  onConnected,
}: {
  session: Session;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(session.status);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const res = await fetch(`/api/settings/whatsapp/sessions/${encodeURIComponent(session.id)}/qr`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setErr(data.error || "QR indisponible");
        } else {
          setErr(null);
          setStatus(data.status ?? "?");
          setQr(data.qrCode ?? null);
          if (CONNECTED.includes(String(data.status).toLowerCase())) {
            toast.success("WhatsApp connecté ✅");
            onConnected();
            onClose();
            return;
          }
        }
      } catch {
        /* réseau : on retentera */
      }
      if (active) timer = setTimeout(poll, 4000);
    }
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [session.id, onClose, onConnected]);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 w-full max-w-xs text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[14px] font-semibold">Scanner — {session.name}</div>
          <button onClick={onClose} aria-label="Fermer" className="text-[var(--color-fg-mute)]">
            <X className="size-4" />
          </button>
        </div>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR WhatsApp" className="w-full rounded-[var(--radius)] bg-white p-2" />
        ) : err ? (
          <div className="py-8 text-[12.5px] text-[var(--color-danger)] font-mono">{err}</div>
        ) : (
          <div className="py-8 text-[12.5px] text-[var(--color-fg-3)]">
            En attente du QR… (statut : {status})
          </div>
        )}
        <p className="text-[11.5px] text-[var(--color-fg-3)] mt-3">
          WhatsApp → Appareils connectés → Lier un appareil. La fenêtre se ferme dès la connexion.
        </p>
      </div>
    </div>
  );
}
