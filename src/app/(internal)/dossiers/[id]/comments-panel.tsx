"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  readOnly = false,
}: {
  dossierId: string;
  comments: Comment[];
  readOnly?: boolean;
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
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Commentaires
          <span className="ml-2 text-[11.5px] font-normal text-[var(--color-fg-3)] tnum">
            {comments.length}
          </span>
        </CardTitle>
      </CardHeader>

      {!readOnly && (
        <form onSubmit={submit} className="px-5 py-4 border-b border-[var(--color-border)] space-y-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ajouter un commentaire…"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-[12px] text-[var(--color-fg-2)] cursor-pointer">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              Interne (non visible au client)
            </label>
            <Button size="sm" disabled={pending || !body.trim()}>
              {pending ? "Envoi…" : "Publier"}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-[var(--color-border)]">
        {comments.length === 0 && (
          <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucun commentaire.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="px-5 py-3 flex gap-3">
            <Avatar name={c.authorName} size={28} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13px] font-medium">{c.authorName}</span>
                <span className="text-[11px] text-[var(--color-fg-3)]">
                  {formatDateTime(c.createdAt)}
                </span>
                {!c.internal && (
                  <span className="text-[11px] text-[var(--color-accent)]">· visible client</span>
                )}
              </div>
              <div className="text-[13px] mt-1 whitespace-pre-wrap text-[var(--color-fg-2)]">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
