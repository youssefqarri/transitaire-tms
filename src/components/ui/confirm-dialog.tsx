"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warn" | "info";
  /** Si fourni, l'utilisateur doit taper ce mot exact pour activer le bouton. */
  confirmWord?: string;
  pending?: boolean;
  onConfirm: () => void;
};

const TONE_ICON_CLASS = {
  danger: "text-[var(--color-danger)] bg-[var(--color-danger-soft)]",
  warn: "text-[var(--color-warning)] bg-[var(--color-warning-soft)]",
  info: "text-[var(--color-accent)] bg-[var(--color-accent-soft)]",
} as const;

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
  confirmWord,
  pending = false,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onOpenChange]);

  if (!open) return null;

  const canConfirm = confirmWord ? typed.trim() === confirmWord : true;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6 animate-fade-in"
      onClick={() => !pending && onOpenChange(false)}
    >
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 pt-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "size-9 rounded-full flex items-center justify-center shrink-0",
                TONE_ICON_CLASS[tone],
              )}
            >
              <AlertTriangle className="size-4" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-[var(--color-fg)]">{title}</div>
              {description && (
                <div className="text-[13px] text-[var(--color-fg-3)] mt-1.5 leading-relaxed">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => !pending && onOpenChange(false)}
              className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] shrink-0"
              aria-label="Fermer"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          {confirmWord && (
            <div className="mt-4 ml-12 space-y-1.5">
              <label
                htmlFor="confirm-word"
                className="text-[12px] text-[var(--color-fg-3)]"
              >
                Pour confirmer, tapez{" "}
                <code className="font-mono text-[12px] bg-[var(--color-surface-2)] px-1 py-0.5 rounded">
                  {confirmWord}
                </code>
              </label>
              <input
                id="confirm-word"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoFocus
                className="flex h-9 w-full px-3 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)] focus-visible:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 mt-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={pending || !canConfirm}
          >
            {pending ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
