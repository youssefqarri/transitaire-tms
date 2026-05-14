"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <section>
      <h2
        className="font-display text-[28px] tracking-[-0.018em] mb-4"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
      >
        Annotations
        <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] tabular">
          · {comments.length}
        </span>
      </h2>

      <form onSubmit={submit} className="space-y-3 mb-6">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ajouter une annotation…"
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-soft)] cursor-pointer">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
              className="accent-[var(--color-ink)]"
            />
            Interne · non visible au client
          </label>
          <Button size="sm" disabled={pending || !body.trim()}>
            {pending ? "Envoi…" : "Publier"}
          </Button>
        </div>
      </form>

      <div className="border-t border-b border-[var(--color-rule-strong)]">
        {comments.length === 0 && (
          <div className="py-10 text-center text-[14px] text-[var(--color-ink-mute)] font-display italic">
            Aucune annotation.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="py-4 border-b border-[var(--color-rule)] last:border-b-0 flex gap-4">
            <Avatar name={c.authorName} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-display italic text-[15px]">{c.authorName}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)] tabular">
                  {formatDateTime(c.createdAt)}
                </span>
                {!c.internal && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-stamp)]">
                    · visible client
                  </span>
                )}
              </div>
              <div className="text-[14px] mt-2 whitespace-pre-wrap leading-relaxed">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
