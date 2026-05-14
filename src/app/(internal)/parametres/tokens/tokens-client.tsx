"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type Token = {
  id: string;
  label: string;
  prefix: string;
  userName: string;
  userEmail: string;
  userRole: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revoked: boolean;
};

export function TokensClient({
  tokens,
  users,
}: {
  tokens: Token[];
  users: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(tokens.length === 0);
  const [label, setLabel] = useState("");
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !userId) {
      toast.error("Label et utilisateur requis");
      return;
    }
    start(async () => {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      setCreatedToken(data.token);
      setLabel("");
      router.refresh();
    });
  }

  function revoke(id: string) {
    if (!confirm("Révoquer ce token ? L'intégration cessera de fonctionner immédiatement.")) return;
    start(async () => {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      toast.success("Token révoqué");
      router.refresh();
    });
  }

  function copyToken() {
    if (!createdToken) return;
    navigator.clipboard.writeText(createdToken);
    toast.success("Copié dans le presse-papier");
  }

  return (
    <div className="space-y-6">
      {createdToken && (
        <div className="rounded-[var(--radius)] border border-[oklch(80%_0.18_75)] bg-[oklch(98%_0.06_75)] p-4">
          <div className="font-medium text-sm mb-2">Token généré — copiez-le maintenant</div>
          <div className="text-xs text-[var(--color-muted-foreground)] mb-3">
            Ce token n'est affiché qu'une seule fois. Stockez-le dans un endroit sûr (gestionnaire
            de mots de passe, ou variable d'environnement).
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-[var(--color-card)] px-3 py-2 rounded border border-[var(--color-border)] break-all">
              {createdToken}
            </code>
            <Button variant="outline" size="sm" onClick={copyToken}>
              <Copy className="size-4" /> Copier
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setCreatedToken(null)}>
            J'ai sauvegardé le token
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Tokens existants</div>
          <div className="text-xs text-[var(--color-muted-foreground)]">
            {tokens.length} token{tokens.length > 1 ? "s" : ""}
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" /> Nouveau token
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={create}
          className="border border-[var(--color-border)] rounded-[var(--radius)] p-4 space-y-3 bg-[var(--color-muted)]/40"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Étiquette</Label>
              <Input
                id="label"
                placeholder="Ex. Claude — Karim"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">Hérite des permissions de</Label>
              <Select id="userId" value={userId} onChange={(e) => setUserId(e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "Création…" : "Générer le token"}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-[var(--color-border)]">
        {tokens.length === 0 && !showForm && (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            <Key className="size-8 mx-auto mb-2 text-[var(--color-muted-foreground)]" />
            Aucun token. Créez-en un pour permettre à une intégration externe d'accéder à l'API.
          </div>
        )}
        {tokens.map((t) => (
          <div key={t.id} className="py-4 flex items-center gap-4">
            <div className="size-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0">
              <Key className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{t.label}</span>
                <code className="text-xs text-[var(--color-muted-foreground)] font-mono">
                  {t.prefix}…
                </code>
                {t.revoked && <Badge tone="danger">Révoqué</Badge>}
                {!t.revoked && t.expiresAt && new Date(t.expiresAt) < new Date() && (
                  <Badge tone="danger">Expiré</Badge>
                )}
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)]">
                {t.userName} · {t.userRole} · créé le {formatDateTime(t.createdAt)}
                {t.lastUsedAt && ` · dernière utilisation ${formatDateTime(t.lastUsedAt)}`}
              </div>
            </div>
            {!t.revoked && (
              <Button variant="ghost" size="icon" onClick={() => revoke(t.id)} title="Révoquer">
                <Trash2 className="size-4 text-[var(--color-destructive)]" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
