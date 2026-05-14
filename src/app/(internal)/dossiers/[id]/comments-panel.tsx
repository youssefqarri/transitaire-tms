"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";

type Comment = {
  id: string;
  body: string;
  internal: boolean;
  createdAt: Date;
  authorName: string;
};

export function CommentsPanel({
  dossierId,
  comments,
}: {
  dossierId: string;
  comments: Comment[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(true);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    start(async () => {
      const res = await fetch(`/api/dossiers/${dossierId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, internal }),
      });
      if (!res.ok) { toast.error("Erreur"); return; }
      setBody("");
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="p-5 border-b border-[var(--color-border)] font-semibold flex items-center gap-2">
        <MessageSquare className="size-4" /> Commentaires
      </div>
      <form onSubmit={submit} className="p-5 space-y-3 border-b border-[var(--color-border)]">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ajouter un commentaire…"
          className="w-full min-h-[80px] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] resize-y"
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
            />
            Interne (non visible au client)
          </label>
          <Button size="sm" disabled={pending || !body.trim()}>
            {pending ? "Envoi…" : "Publier"}
          </Button>
        </div>
      </form>
      <div className="divide-y divide-[var(--color-border)]">
        {comments.length === 0 && (
          <div className="p-6 text-sm text-[var(--color-muted-foreground)] text-center">
            Aucun commentaire.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="p-4 flex gap-3">
            <Avatar name={c.authorName} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{c.authorName}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {formatDateTime(c.createdAt)}
                </span>
                {!c.internal && (
                  <span className="text-xs text-[var(--color-primary)]">· visible client</span>
                )}
              </div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
