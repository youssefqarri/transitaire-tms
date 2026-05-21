"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { emitNotifRead } from "@/components/layout/unread-badge";

type Props = {
  id: string;
  title: string;
  body?: string | null;
  kindLabel: string;
  dossierNumber?: string | null;
  link: string;
  read: boolean;
  createdAt: Date;
};

export function NotifRow({
  id,
  title,
  body,
  kindLabel,
  dossierNumber,
  link,
  read,
  createdAt,
}: Props) {
  const router = useRouter();
  // optimistic state pour que la pastille disparaisse immédiatement
  const [localRead, setLocalRead] = useState(read);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!localRead) {
      setLocalRead(true);
      // Décrémente le badge sidebar immédiatement (état optimiste)
      emitNotifRead({ delta: 1 });
      // mark read en parallèle, sans bloquer la navigation
      fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    }
    router.push(link);
  }

  return (
    <a
      href={link}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-[var(--color-surface-2)]/50 transition-colors",
        !localRead && "bg-[var(--color-accent)]/5",
      )}
    >
      <div
        className={cn(
          "size-2 rounded-full mt-2 shrink-0",
          !localRead ? "bg-[var(--color-accent)]" : "bg-transparent",
        )}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[13px] text-[var(--color-fg)]">
            {title}
          </span>
          <Badge tone="outline">{kindLabel}</Badge>
          {dossierNumber && (
            <span className="text-[11.5px] text-[var(--color-fg-mute)]">
              Dossier {dossierNumber}
            </span>
          )}
          {!localRead && <span className="sr-only">Non lu</span>}
        </div>
        {body && (
          <div className="text-[13px] text-[var(--color-fg-3)] mt-1">{body}</div>
        )}
      </div>
      <div className="text-[11.5px] text-[var(--color-fg-mute)] whitespace-nowrap">
        {formatDateTime(createdAt)}
      </div>
    </a>
  );
}
