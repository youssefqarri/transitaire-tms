"use client";

import { useState } from "react";
import { Mail, MessageCircle, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type Msg = {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  subject: string | null;
  body: string;
  status: string;
  error: string | null;
  toAddress: string;
  templateKey: string | null;
  sentByName: string | null;
  createdAt: Date;
  sentAt: Date | null;
};

const STATUS_TONE: Record<string, "info" | "ok" | "danger" | "neutral" | "warn"> = {
  PENDING: "neutral",
  SENT: "ok",
  DELIVERED: "ok",
  READ: "ok",
  FAILED: "danger",
};

export function OutgoingMessagesPanel({ messages }: { messages: Msg[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Notifications envoyées
          <span className="ml-2 text-[12px] font-normal text-[var(--color-fg-3)] tnum">
            {messages.length}
          </span>
        </CardTitle>
      </CardHeader>
      <div className="divide-y divide-[var(--color-border)]">
        {messages.map((m) => {
          const isOpen = expanded === m.id;
          return (
            <div key={m.id}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : m.id)}
                className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-[var(--color-surface-2)] transition-colors"
              >
                {m.channel === "EMAIL" ? (
                  <Mail className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                ) : (
                  <MessageCircle className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium truncate">
                      {m.subject || m.body.split("\n")[0].slice(0, 60)}
                    </span>
                    <Badge tone={STATUS_TONE[m.status] ?? "neutral"}>{m.status}</Badge>
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-3)] mt-0.5">
                    → {m.toAddress} ·{" "}
                    {m.sentAt
                      ? formatDateTime(m.sentAt)
                      : `Tenté ${formatDateTime(m.createdAt)}`}
                    {m.sentByName && ` · ${m.sentByName}`}
                  </div>
                </div>
                <ChevronDown
                  className={`size-3.5 text-[var(--color-fg-mute)] shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-1 space-y-2">
                  {m.error && (
                    <div className="rounded-[var(--radius)] bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 px-3 py-2 text-[12px] text-[var(--color-danger)]">
                      {m.error}
                    </div>
                  )}
                  <pre className="text-[13px] whitespace-pre-wrap font-sans text-[var(--color-fg-2)] bg-[var(--color-surface-2)] rounded-[var(--radius)] px-3 py-2">
                    {m.body}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
